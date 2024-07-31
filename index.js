const path = require('path')
const fs = require('fs')
// const map = new Map()

// 获取匹配的arch
const getArchs = (arch) => (source) => {
  let reg = !!arch
    ? new RegExp(`^\\s*import(.+?)['"](?<path>(?:.*?\\/)*?${arch}\\/(?<target>.+?))['"]`, 'mg')
    : /^\s*import(.+?)['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]/gm
  return source.match(reg)
}

// arch import 描述信息
const getArchDescr = (arch) => (source) => {
  let reg = !!arch
    ? new RegExp(`^\\s*import(?:.+?)['"](?<path>(?:.*?\\/)*?${arch}\\/(?<target>.+?))['"]$`, 'm')
    : /^\s*import(?:.+?)['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]$/m
  return source.match(reg)
}

// arch import 描述信息
const getArchDescrMore = (arch) => (source) => {
  let reg = !!arch
    ? new RegExp(`^\\s*import\\s*(?<module>.+?)\\s*from\\s*['"](?<path>(?:.*?\\/)*?${arch}\\/(?<target>.+?))['"]`, 'm')
    : /^\s*import\s*(?<module>.+?)\s*from\s*['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]/m
  return source.match(reg)
}

// 解析arch import内容
const parseImport = (join, matchPlugin) => (source) => {
  const { gadFn, gadmFn } = matchPlugin
  let matchs = []
  if ((matchs = gadmFn(source))) {
    const { module, path, target } = matchs.groups
    return join({ module, frompath: path, targetpath: target })
  }
  if ((matchs = gadFn(source))) {
    const { path, target } = matchs.groups
    return join({ module: '', frompath: path, targetpath: target })
  }
  return {}
}

// 文件存在 (string,string)=>string
const getFilePath = (rootPath, targetpath) => {
  const targetFile = path.resolve(rootPath, `./${targetpath}`)
  if (fs.existsSync(targetFile)) {
    return targetFile.replace(/\\/g, '/')
  }
  throw new Error('not found file')

  // if (fs.realpathSync(targetFile)) {
  //   return targetFile
  // }
}

// 递归文件目录node_modules中的monorepo 项目
const requireTry = (rootPath, filepath) => {
  if (!rootPath) return false
  try {
    // console.log(`${rootPath}/node_modules`, filepath)
    return getFilePath(`${rootPath}/node_modules`, filepath)
  } catch (err) {
    // console.log(rootPath, filepath)
    return requireTry(rootPath.split(path.sep).slice(0, -1).join(path.sep), filepath)
  }
}

// 查询依赖树
const requireDependencies = (dependencies, fn) => {
  let i = dependencies.length
  while (i >= 0) {
    const redirect = fn(dependencies[i])
    if (redirect) return redirect
    i--
  }
}

// 替换arch import内容
const replaceContent = (imports, source, { rootPath, arch, dependencies }) => {
  const gadFn = getArchDescr(arch)
  const gadmFn = getArchDescrMore(arch)
  const join = ({ module, frompath, targetpath }) => {
    const moduleFrom = module ? `${module} from` : ''

    try {
      return `\n import ${moduleFrom} '${getFilePath(rootPath, targetpath)}'`
    } catch (err) {
      if (!dependencies) return `\n import ${moduleFrom} '${frompath}'`

      const targetfile = requireDependencies(dependencies, (redirect) => requireTry(rootPath, `${redirect}/${targetpath}`))
      // console.log({ targetfile })
      if (targetfile) return `\n import ${moduleFrom} '${targetfile}'`

      // 兜底
      return `\n import ${moduleFrom} '${frompath}'`
    }
  }
  return imports.reduce((memo, imtpl) => {
    return memo.replace(imtpl, parseImport(join, { gadFn, gadmFn })(imtpl))
  }, source)
}

// 替换内容
function replace(source, callback) {
  const {
    resourcePath,
    rootContext,
    query: { root, arch, type, dependencies }
  } = this

  if (type && path.extname(resourcePath).replace('.', '') != type) return callback(null, source)

  const imports = getArchs(arch)(source)
  if (!imports) return callback(null, source)
  // if (map.has(resourcePath)) map.get(resourcePath)

  const rootPath = root ? path.resolve(rootContext, root) : rootContext
  const ret = replaceContent(imports, source, { rootPath, arch, dependencies })
  // map.set(resourcePath, ret)
  return callback(null, ret)
}

function replaceAsync(source) {
  var callback = this.async()
  // callback(null, replace.bind(this)(source))
  replace.bind(this)(source, callback)
}

// module.exports = replace
module.exports = replaceAsync

module.exports.parseImport = parseImport
module.exports.getArchDescr = getArchDescr
module.exports.getArchs = getArchs
module.exports.getArchDescrMore = getArchDescrMore
module.exports.replaceContent = replaceContent
