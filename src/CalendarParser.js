/**
 * @author Mapl
 * @file CalendarParser.js
 * @abstract 解析教务系统校历页面
 * @exports parseDOMOfCalendar
 * @license GPLv3
 * @version 1.0
 * @date 2021-08-05
 */

const calendarTermName = { // 校历学期对照表
    "秋" : "秋季",
    "春" : "春季",
    "夏季学期" : "暑假"
}

const CalendarWeekdayList = { // 校历星期几对照表
    "星期一" : 1,
    "星期二" : 2,
    "星期三" : 3,
    "星期四" : 4,
    "星期五" : 5,
    "星期六" : 6,
    "星期日" : 7,
}

/**
 * 将校历的学期名称转为实际名称
 * @param { String } text 校历所写的学期名称
 * @returns { String } 对应的学期名称
 */
function getCalendarTerm (text) {
    return calendarTermName[text]
}

/**
 * 计算校历星期几对应的数字
 * @param { String } text 校历星期几
 * @returns { String } 星期几对应的数字
 */
function getCalendarWeekdayNumber (text) {
    return CalendarWeekdayList[text]
}

/**
 * 将校历中的时间字符串转为时间对象
 * @param {*} text 校历中的时间字符串
 * @returns { Date } 生成的Date对象(本地时间)
 */
function getDateForCalendarDateString (text) {
    const [year, month, day] = text
        .split("-")
        .map(e => Number.parseInt(e, 10))
    return new Date(year, month - 1, day)
}

/**
 * 解析校历DOM
 * @param { HTMLTableElement } domTable 校历对应的DOM元素
 * @returns { Map } 结构化的校历信息
 */
function parseCalendarTable (domTable) {
    const calendarMap = new Map()
    for (const row of domTable.rows) {
        if (row.cells[0].innerText == "学年") {
            continue // 跳过标题行
        }
        const infoKey = [
            row.cells[0].innerText | 0,
            getCalendarTerm(row.cells[1].innerText)
        ]
        const infoValue = {
            "startDate" : getDateForCalendarDateString(row.cells[3].innerText),
            "totalWeek" : row.cells[4].innerText | 0,
            "weekStart" : getCalendarWeekdayNumber(row.cells[5].innerText)
        }
        calendarMap.set(infoKey, infoValue)
    }
    return calendarMap
}

/**
 * 解析校历页面DOM
 * @param { Document } dom 校历页面DOM
 * @returns { * } 结构化校历页面信息
 */
function parseDOMOfCalendar (dom) {
    const calendarTable = dom.querySelector(".datalist")
    return parseCalendarTable(calendarTable)
}

// 在首页上进行测试
// parseDOMOfCalendar(window.frames[0].document.querySelector("#mainFrame").contentDocument)
