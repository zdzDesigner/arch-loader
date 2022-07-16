const path = require('path')
const fs = require('fs')



// 获取匹配的arch
const getArchs = (arch) => (source) => {
  let reg = !!arch
    ? new RegExp(`^\\s*import(.+)?['"](?<path>(?:.*\\/)*${arch}?\\/(?<target>.+))?['"]$`, 'mg')
    : /^\s*import(.+?)['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]/mg
  return source.match(reg)
}

// arch import 描述信息
const getArchDescr = (arch) => (source) => {
  let reg = !!arch
    ? new RegExp(`^\\s*import.+['"](?<path>(?:.*\\/)*${arch}?\\/(?<target>.+))?['"]$`, 'm')
    : /^\s*import(?:.+?)['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]$/m
  return source.match(reg)
}

// arch import 描述信息
const getArchDescrMore = (arch) => (source) => {
  let reg = !!arch
    ? new RegExp(`^\\s*import\\s*(?<module>.+?)\\s*from\\s*['"](?<path>(?:.*\\/)*${arch}?\\/(?<target>.+))?['"]$`, 'm')
    : /^\s*import\s*(?<module>.+?)\s*from\s*['"](?<path>(?:.*?\/)*?arch\/(?<target>.+?))['"]/m
  return source.match(reg)
}


// 解析arch import内容
const parseImport = (join, source, matchPlugin) => {
  const { gadFn, gadmFn } = matchPlugin
  let matchs = []
  if (matchs = gadmFn(source)) {
    const { module, path, target } = matchs.groups
    return join({ module, frompath: path, targetpath: target })
  }
  if (matchs = gadFn(source)) {
    const { path, target } = matchs.groups
    return join({ module: '', frompath: path, targetpath: target })
  }
  return {}
}


// 文件存在 (string,string)=>string
const getFilePath = (rootPath) => (targetpath) => {
  const targetFile = path.resolve(rootPath, `./${targetpath}`)
  if (fs.realpathSync(targetFile)) {
    return targetpath
  }
  return ''
}

// 替换arch import内容
const replaceContent = (imports, source, arch, getFilePathFn) => {
  const gadFn = getArchDescr(arch)
  const gadmFn = getArchDescrMore(arch)
  return imports.reduce((memo, imtpl) => {
    return memo.replace(imtpl, parseImport(({ module, frompath, targetpath }) => {
      const moduleFrom = module ? `${module} from` : ''
      try {
        return `\n import ${moduleFrom} '${getFilePathFn(targetpath)}'`
      } catch (err) {
        return `\n import ${moduleFrom} '${frompath}'`
      }

    }, imtpl, { gadFn, gadmFn }))
  }, source)
}


// 替换内容
function replace(source, inputSourceMap) {
  const { resourcePath, rootContext, query: { root, arch, type } } = this
  if (type && path.extname(resourcePath).replace('.', '') != type) return source

  const imports = getArchs(arch)(source)
  if (!imports) return source



  const rootPath = root ? path.resolve(rootContext, root) : rootContext
  return replaceContent(imports, source, arch, getFilePath(rootPath))

}
module.exports = replace

module.exports.parseImport = parseImport
module.exports.getArchDescr = getArchDescr
module.exports.getArchs = getArchs
module.exports.getArchDescrMore = getArchDescrMore
module.exports.replaceContent = replaceContent


