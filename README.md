# arch-loader

> 穿越多项目, 隔离项目中的不同实现 _(建议:结合 workspaces)_

## question and solution

- 一个已经正常运行的项目如何优雅衍生出多平台的项目?
- 一个已经正常运行的项目如何优雅定制不同的功能?

为了解决以上问题我们通常会有一下解决方案:

1. 在项目中加上平台或不同项目的配置，项目运行根据配置来执行不同的代码段;
   - 缺点:
     - 编译后所有的代码都打包到一起，导出资源增大
     - 源代码在同一个项目的文件资源中, 和逻辑冗余在一起, 维护不变
2. 在项目中加上平台或不同项目的构建配置，项目构建打包时根据构建配置来编译出需要导出的代码;
   - 缺点:
     - 源代码在同一个项目的文件资源中, 和逻辑冗余在一起, 维护不变
   - 优点:
     - 构建打包后的代码中只要当前项目或平台依赖的实现, 不会增大导出资源

- 当前实现
  不同的平台或项目实现差异(各自)的功能, 项目打包构建时会根据打包的项目来加载当前项目的实现;
  - 优点:
    - 构建打包后的代码中只要当前项目或平台依赖的实现, 不会增大导出资源
    - 无需在代码中添加构建配置, 差异化的功能实现放在各自的项目中，不冗余，易维护

## use

_webpack arch-loader config_

```js
{
  rules: [
    {
      test: /.js$/,
      use: [
        {
          loader: 'babel-loader'
        },
        {
          loader: 'arch-loader',
          options: {
            root: 'src', // rootpath
            type: 'js',
            arch: 'arch', // default
            // project dependencies
            dependencies: ['@monorepo/rootproject/rootpath', '@monorepo/parentproject/rootpath']
          }
        }
      ]
    },
    {
      test: /.vue$/,
      use: [
        {
          loader: 'vue-loader'
        },
        {
          loader: 'arch-loader',
          options: {
            root: 'src',
            type: 'vue',
            arch: 'arch', // default
            dependencies: ['@monorepo/rootproject/rootpath', '@monorepo/parentproject/rootpath']
          }
        }
      ]
    }
  ]
}
```

**project MAIN**

```js
import module from './arch/laoluo/cap.js'
src
├── arch
│   └── laoluo
│        └── cap.js
│
├── compmonents
│   └── hoc
└── pages

// cap.js
console.log('middle cap!!!')

```

**project A**

```js
src
├── laoluo
│    └── cap.js

// project entry
import 'project MAIN'

// cap.js
console.log('big cap!!!')
```

**project B**

```js
├── laoluo
│    └── cap.js

// project entry
import 'project MAIN'

// cap.js
console.log('little cap!!!')
```



## history
- v0.3.0
  添加dependencies 
- v0.3.1
  fix windows path error

