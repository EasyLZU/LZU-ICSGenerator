## LZU课表导出助手v2.2

用于将LZU教务系统课表导出为ics格式，方便导入到日历中。

本项目使用纯EcmaScript编写，在浏览器端运行，无其他第三方依赖。

理论上支持其他优慕课教务系统。

### 使用

> 请注意Greasemonkey不支持本项目所需特性([more](https://github.com/greasemonkey/greasemonkey/issues/2574))，因此无法正常运行。

* 安装Tampermonkey或类似的浏览器插件，导入ICSGenerator.js。
* 访问教务系统课表页面，点击新增的按钮“导出ICS日历文件”。
* 修改导出的课程名称，并删除不需要的上课时间地点（点击重置可清除修改）。
* 点击“课表导出选项”中的“确定导出”，即可下载ICS格式的日历文件。

请自行检查生成文件的完整性和正确性。

### 构建

在项目根目录下运行build.sh

### TODO

* 定制课表输出

