import path from 'path'
import fs from 'fs'

// Interface definitions
export type MatchGroups = {
  path: string
  target: string
  module?: string
}

export type MatchResult = {
  groups: MatchGroups
}

export type JoinResult = {
  module: string
  frompath: string
  targetpath: string
}

export interface MatchPlugin {
  gadFn: (source: string) => MatchResult | null
  gadmFn: (source: string) => MatchResult | null
}

export type ReplaceOptions = {
  rootPath: string
  arch: string
  dependencies?: string[]
}

// Get matching archs
export const getArchs =
  (arch: string) =>
  (source: string): RegExpMatchArray | null => {
    const reg = !!arch
      ? new RegExp(`^\\s*import(.+?)['"](?<path>(?:.*?\\/)*?${arch}\\/(?<target>.+?))['"]`, 'mg')
      : /^\s*import(.+?)['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]/gm
    return source.match(reg)
  }

// Arch import description
export const getArchDescr =
  (arch: string) =>
  (source: string): MatchResult | null => {
    const reg = !!arch
      ? new RegExp(`^\\s*import(?:.+?)['"](?<path>(?:.*?\\/)*?${arch}\\/(?<target>.+?))['"]$`, 'm')
      : /^\s*import(?:.+?)['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]$/m
    return source.match(reg) as MatchResult | null
  }

// Arch import description with more details
export const getArchDescrMore =
  (arch: string | null) =>
  (source: string): MatchResult | null => {
    const reg = !!arch
      ? new RegExp(`^\\s*import\\s*(?<module>.+?)\\s*from\\s*['"](?<path>(?:.*?\\/)*?${arch}\\/(?<target>.+?))['"]`, 'm')
      : /^\s*import\s*(?<module>.+?)\s*from\s*['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]/m
    return source.match(reg) as MatchResult | null
  }

// Parse arch import content
export const parseImport =
  (join: (result: JoinResult) => string, matchPlugin: MatchPlugin) =>
  (source: string): string => {
    const { gadFn, gadmFn } = matchPlugin
    let matchs: MatchResult | null

    if ((matchs = gadmFn(source))) {
      const { module, path: frompath, target: targetpath } = matchs.groups
      return join({ module: module || '', frompath, targetpath })
    }
    if ((matchs = gadFn(source))) {
      const { path: frompath, target: targetpath } = matchs.groups
      return join({ module: '', frompath, targetpath })
    }
    return ''
  }

// Get file path
const getFilePath = (rootPath: string, targetpath: string): string => {
  const targetFile = path.resolve(rootPath, `./${targetpath}`)
  if (fs.existsSync(targetFile)) {
    return targetFile.replace(/\\/g, '/')
  }
  throw new Error('not found file')
}

// Recursive try for node_modules in monorepo
const requireTry = (rootPath: string | undefined, filepath: string): string | false => {
  if (!rootPath) return false
  try {
    return getFilePath(`${rootPath}/node_modules`, filepath)
  } catch (err) {
    return requireTry(rootPath.split(path.sep).slice(0, -1).join(path.sep), filepath)
  }
}

// Query dependencies tree
const requireDependencies = <T>(dependencies: string[], fn: (dep: string) => T | undefined): T | undefined => {
  let i = dependencies.length
  while (i >= 0) {
    const redirect = fn(dependencies[i])
    if (redirect) return redirect
    i--
  }
}

// Replace arch import content
export const replaceContent = (imports: string[], source: string, { rootPath, arch, dependencies }: ReplaceOptions): string => {
  const gadFn = getArchDescr(arch)
  const gadmFn = getArchDescrMore(arch)

  const join = ({ module, frompath, targetpath }: JoinResult): string => {
    const moduleFrom = module ? `${module} from` : ''
    try {
      return `\n import ${moduleFrom} '${getFilePath(rootPath, targetpath)}'`
    } catch (err) {
      if (!dependencies) return `\n import ${moduleFrom} '${frompath}'`

      const targetfile = requireDependencies(dependencies, (redirect) => requireTry(rootPath, `${redirect}/${targetpath}`))
      if (targetfile) return `\n import ${moduleFrom} '${targetfile}'`

      return `\n import ${moduleFrom} '${frompath}'`
    }
  }

  return imports.reduce((memo, imtpl) => {
    return memo.replace(imtpl, parseImport(join, { gadFn, gadmFn })(imtpl))
  }, source)
}

// Replace function with loader context
type LoaderContext = {
  resourcePath: string
  rootContext: string
  query: {
    root?: string
    arch: string
    type?: string
    dependencies?: string[]
  }
  async(): (err: Error | null, result: string) => void
}

function replace(this: LoaderContext, source: string, callback: (err: Error | null, result: string) => void): void {
  const {
    resourcePath,
    rootContext,
    query: { root, arch, type, dependencies }
  } = this

  if (type && path.extname(resourcePath).replace('.', '') !== type) {
    return callback(null, source)
  }

  const imports = getArchs(arch)(source)
  if (!imports) return callback(null, source)

  const rootPath = root ? path.resolve(rootContext, root) : rootContext
  const ret = replaceContent(imports, source, { rootPath, arch, dependencies })
  return callback(null, ret)
}

function realpathSync(this: LoaderContext, source: string): void {
  const callback = this.async()
  replace.bind(this)(source, callback)
}

export default realpathSync

// Rollup plugin options
type RollupOptions = {
  root: string
  arch: string
  type?: string
  types?: string[]
  dependencies?: string[]
}
export const rollup = ({ root, arch, type, types = [], dependencies }: RollupOptions) => {
  return {
    name: 'rollup-arch-loader',
    enforce: 'pre' as const,
    transform(source: string, source_path: string): string {
      const extname = path.extname(source_path).replace('.', '')
      if ((types.length > 0 && !types.includes(extname)) || (type && extname !== type)) {
        return source
      }
      const imports = getArchs(arch)(source)
      if (!imports) return source
      const ret = replaceContent(imports, source, { rootPath: root, arch, dependencies })
      console.log({ source_path })
      return ret
    }
  }
}
