/**
 * @author Mapl
 * @file InjectPage.js
 * @abstract 注入页面脚本
 * @exports modifyHTML, getDOMOfCal, downloadBlob
 * @license GPLv3
 * @version 1.0
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
 * 修改注入页面
 * @returns { HTMLInputElement } 新增的按钮
 */
function modifyHTML () {
    const buttonTD = document.querySelector(
        ".broken_tab > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(5)"
    )
    const genButton = document.createElement("input")
    genButton.setAttribute("class", "button")
    genButton.setAttribute("type", "submit")
    genButton.setAttribute("value", "下载日历文件(ICS格式)")
    genButton.setAttribute("style", "margin-left: 15px;width: 180px;")
    buttonTD.appendChild(genButton)
    return genButton
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
