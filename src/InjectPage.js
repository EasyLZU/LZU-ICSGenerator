/**
 * @author Mapl
 * @file InjectPage.js
 * @abstract 注入页面脚本
 * @exports modifyHTML, getDOMOfCal, downloadBlob
 * @license GPLv3
 * @version 2.0
 * @date 2021-08-05
 */

/**
 * 从首页或注入页获取首页FrameSet的DOM
 * @param { Window } win 当前页面的Window对象
 * @returns { Document } 首页FrameSet的DOM
 */
 function getDOMOfFrameSet (win) {
    if (window.parent == window) {
        return win.frames[0].document
    }  else {
        return win.parent.document
    }
}

/**
 * 从首页FrameSet的DOM获取校历页面Href
 * @param { Document } dom 首页FrameSet的DOM
 * @returns { String } 校历页面Href
 */
function getCalHrefFromFrameSet (dom) {
    return dom
        .querySelector("#menuFrame").contentDocument
        .querySelector("#li9 > a").getAttribute("href")
}

/**
 * 从注入页面得到校历页面DOM
 * @returns { Document } 校历页面DOM
 */
function getDOMOfCal () {
    const frameSetDOM = getDOMOfFrameSet(window)
    console.log(frameSetDOM)
    const calHref = getCalHrefFromFrameSet(frameSetDOM)
    return new Promise((resolve, reject) => {
        const calFrame = frameSetDOM.createElement("iframe")
        calFrame.src = calHref
        frameSetDOM.querySelector("html").appendChild(calFrame)
        calFrame.addEventListener("load", (event) => {
            resolve(calFrame.contentDocument)
        })
        calFrame.addEventListener("error", (event) => {
            reject(event)
        })
    })
}

/**
 * 让table某一列可修改，并转为纯文本
 * @param { HTMLTableElement } table TabelDOM对象
 * @param { Number } col 列索引
 */
function makeTableColEditable (table, col) {
    const rowLen = table.rows.length
    for (let index = 1; index < rowLen; index++) {
        table.rows[index].cells[col].innerText = table.rows[index].cells[col].innerText
        table.rows[index].cells[col].contentEditable = true
    }
}

/**
 * 修改注入页面
 * @param { String } provider 功能提供者，用于渲染页面
 * @returns { HTMLInputElement } 新增的按钮
 */
function modifyHTML (provider) {
    const buttonTD = document.querySelector(
        ".broken_tab > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(5)"
    ) // 导出功能入口按钮位置
    const brToAppend = document.querySelector("br") // 配置面板位置
    const tableCourse = document.querySelector("table.infolist_tab") // 课表DOM
    /* 导出功能入口按钮 */
    const startButton = document.createElement("input")
    startButton.setAttribute("class", "button")
    startButton.setAttribute("type", "submit")
    startButton.setAttribute("value", `导出ICS日历文件(${provider})`)
    startButton.setAttribute("style", "margin-left: 15px;width: 220px;")
    /* 导出配置面板 */
    brToAppend.insertAdjacentHTML("afterEnd", `\
    <table id="mapl-conf-title" class="subtitle" cellspacing="0" cellpadding="0" style="display: none;">
    <tbody>
        <tr>
            <td class="subtitle">课表导出选项(由${provider}提供)</td>
        </tr>
    </tbody>
    </table>
    <table id="mapl-conf-content" class="broken_tab" cellspacing="0" cellpadding="0" style="display: none;">
        <tbody>
            <tr>
                <td style="width: 25%;">请直接编辑下面表格中相应的<b>课程名称</b>进行修改<br><i>(只针对课表导出，不会影响教务系统实际内容)</i></td>
                <td>
                    <input id="mapl-reload" type="submit" class="button" value="重 置">
                    <input id="mapl-export" class="button" type="submit" style="margin-left: 15px;width: 180px;" value="确定导出">
                </td>
            </tr>
        </tbody>
    </table>`)
    /* 展示配置面板 && 启动课程名称修改功能 */
    const confTitle = document.getElementById("mapl-conf-title")
    const confContent = document.getElementById("mapl-conf-content")
    const reloadButton = document.getElementById("mapl-reload")
    const exportButton = document.getElementById("mapl-export")
    startButton.addEventListener("click", (event) => {
        /* 禁用导出按钮 */
        startButton.disabled = true
        startButton.style.background = "none"
        startButton.style.borderColor = "#888"
        /* 展示配置面板 */
        confTitle.style.display = ""
        confContent.style.display = ""
        /* 启动课程名称修改功能 */
        makeTableColEditable(tableCourse, 2)
        const tableContent = tableCourse.innerHTML
        reloadButton.addEventListener("click", (event) => {
            tableCourse.innerHTML = tableContent
        })
    })
    /* 挂载导出按钮 */
    buttonTD.appendChild(startButton)
    return exportButton
}

/**
 * 下载Blob对象
 * @param { String } fileName 文件名
 * @param { Blob } blob Blob对象
 */
function downloadBlob (fileName, blob) {
    const downloadLiink = document.createElement('a')
    downloadLiink.download = fileName
    downloadLiink.href = URL.createObjectURL(blob)
    document.body.appendChild(downloadLiink)
    downloadLiink.click()
    document.body.removeChild(downloadLiink)
}

// 注入页面测试
// modifyHTML()
// getDOMOfCal().then(console.log)
