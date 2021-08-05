// ==UserScript==
// @name         课表ICS生成(EasyLZU)
// @namespace    https://easylzu.york.moe/
// @version      1.1
// @description  兰州大学教务系统课表ICS日历文件生成
// @author       MaPl
// @match        http://jwk.lzu.edu.cn/academic/student/currcourse/currcourse.jsdo*
// @grant        none
// ==/UserScript==
/**
 * @author Mapl
 * @file CurrcourseParser.js
 * @abstract 解析教务系统课表页面
 * @exports parseDOMOfICS
 * @license GPLv3
 * @version 1.1
 * @date 2021-08-04
 */

const TermInfo = { // 学期信息表
    "1" : "春季",
    "2" : "秋季",
    "3" : "寒假",
    "4" : "暑假"
}

const YearStart = 1980 // YearID与真实年份的偏移量

const WeekdayList = { // 星期几对照表
    "星期一" : 1,
    "星期二" : 2,
    "星期三" : 3,
    "星期四" : 4,
    "星期五" : 5,
    "星期六" : 6,
    "星期日" : 7,
}

/**
 * 计算对应YearID对应的真实年份
 * @param { String | Number } yearID 年份ID
 * @returns { Number } 对应的真实年份
 */
function getRealYear (yearID) {
    return (yearID | 0) + YearStart
}

/**
 * 计算TermID对应的学期名称
 * @param { String } termID termID
 * @returns { String } 对应的学期名称
 */
function getTermName (termID) {
    return TermInfo[termID]
}

/**
 * 计算教师字符串对应的教师列表
 * @param { String } teacherText 教师字符串
 * @returns { Array<String> } 对应的教师列表
 */
function getTeachersList (teacherText) {
    return teacherText.split("\n").slice(0, -1)
}

/**
 * 计算是否缓考
 * @param { String } isDelayText 是否缓考字符串
 * @returns { Boolean } 是否缓考
 */
function getIsDelayTest (isDelayText) {
    return isDelayText != "非缓考"
}

/**
 * 计算实际上课的周号
 * @param { String } text 上课周次文本
 * @returns { Array<Number> } 实际上课周次
 */
function getWeekList (text) {
    let matchResult
    if (matchResult = text.match(/^第(\d+)\-(\d+)周$/)) {
        const [fullmatch, start, end] = matchResult
        return Array.from({ // range(start, end + 1, 1)
            "length" : end - start + 1
        }, (v, k) => (k | 0) + (start | 0))
    }
    if (matchResult = text.match(/^第([0-9,]+)周$/)) {
        return matchResult[1].split(",").map(e => e | 0)
    }
    if (matchResult = text.match(/^(\d+)\-(\d+)周全周$/)) {
        const [fullmatch, start, end] = matchResult
        return Array.from({ // range(start, end + 1, 1)
            "length" : end - start + 1
        }, (v, k) => (k | 0) + (start | 0))
    }
    if (matchResult = text.match(/^(\d+)\-(\d+)周单周$/)) {
        const [fullmatch, start, end] = matchResult
        return Array.from({ // range(start, end + 1, 2)
            "length" : end - start + 1
        }, (v, k) => (k | 0) + (start | 0)).filter(e => e%2 == 1)
    }
    if (matchResult = text.match(/^(\d+)\-(\d+)周双周$/)) {
        const [fullmatch, start, end] = matchResult
        return Array.from({ // range(start, end + 1, 2)
            "length" : end - start + 1
        }, (v, k) => (k | 0) + (start | 0)).filter(e => e%2 == 0)
    }
}

/**
 * 计算星期几对应的数字
 * @param { String } text 星期几
 * @returns { String } 星期几对应的数字
 */
function getWeekdayNumber (text) {
    return WeekdayList[text]
}

/**
 * 解析课程时间地点信息
 * @param { String } text 信息文本
 * @returns { Array } 结构化课程时间地点信息
 */
function getTimeInfoOfCourse (text) {
    const timeTextList = text.split("\n")
    const timeInfoList = []
    for (const timeText of timeTextList) {
        const timeInfoCells = timeText.split("\t")
        const timeInfo = { // 提取时间地点信息
            "weeklist" : getWeekList(timeInfoCells[0]),
            "weekday" : getWeekdayNumber(timeInfoCells[1]),
            "lesson" : timeInfoCells[2],
            "address" : timeInfoCells[3],
        }
        timeInfoList.push(timeInfo)
    }
    return timeInfoList
}

/**
 * 解析课表DOM
 * @param { HTMLTableElement } domTable 课表对应的DOM元素
 * @returns { Array } 结构化的课表信息
 */
function parseCourseTable (domTable) {
    const courseInfoList = []
    for (const row of domTable.rows) {
        if (row.cells[0].innerText == "课程号") {
            continue // 跳过标题行
        }
        const courseInfo = { // 按列提取信息
            "课程号" : row.cells[0].innerText,
            "课程序号" : row.cells[1].innerText | 0,
            "课程名称" : row.cells[2].innerText,
            "任课教师" : getTeachersList(row.cells[3].innerText),
            "学分" : row.cells[4].innerText | 0,
            "选课属性" : row.cells[5].innerText,
            "考核方式" : row.cells[6].innerText,
            "考试性质" : row.cells[7].innerText,
            "是否缓考" : getIsDelayTest(row.cells[8].innerText),
            "上课信息" : getTimeInfoOfCourse(row.cells[9].innerText),
        }
        courseInfoList.push(courseInfo)
    }
    return courseInfoList
}

/**
 * 解析时间表DOM
 * @param { HTMLTableElement } domTable 时间表对应的DOM元素
 * @returns { Map } 结构化的课次对应的起止时间
 */
function parseTimeTable (domTable) {
    const timeList = new Map()
    for (const row of domTable.rows) {
        if (row.cells[0].innerText == "序号") {
            continue // 跳过标题行
        }
        const name = row.cells[1].innerText
        const [start, end] = row.cells[3].innerText.split(" -- ")
        timeList.set(name, { start, end })
    }
    return timeList
}

/**
 * 解析课表页面DOM
 * @param { Document } dom 课表页面DOM
 * @returns { * } 结构化课表页面信息
 */
function parseDOMOfICS (dom) {
    const yearID = dom.querySelector("eduaffair\\:ctrt").getAttribute("year") | 0
    const termID = dom.querySelector("eduaffair\\:ctrt").getAttribute("term")
    const year = getRealYear(yearID) // 年份
    const term = getTermName(termID) // 学期

    const tables = dom.querySelectorAll("table.infolist_tab")
    const tableCourse = tables[0] // 课  表DOM
    const tableTime   = tables[1] // 时刻表DOM
    const courseInfoList = parseCourseTable(tableCourse)
    const timeMap = parseTimeTable(tableTime)
    return {
        year, term,
        course : courseInfoList,
        time : timeMap
    }
}

// 在首页上进行测试
// parseDOMOfICS(window.frames[0].document.querySelector("#mainFrame").contentDocument)
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
/**
 * @author Mapl
 * @file ICS.js
 * @abstract ICS包装类
 * @exports ICSBlock
 * @license GPLv3
 * @version 1.0
 * @date 2021-08-05
 */

const ICS_MIME = "text/calendar" // ICS文件MIME类型

/**
 * 将Date对象转为文本形式(ISO)
 * @param { Date } date Date对象
 * @returns { String } 对应的文本形式时间
 */
function dateToText (date) {
    return date.toISOString().replace(/[\-:]|\.\d{3}/g, "")
}

/**
 * 将键值对打包为一条记录
 * @param { String } key 键
 * @param { String } value 值(文本)
 * @returns { String } 记录字符串
 */
function packetTextRecord (key, value) {
    const content = String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
    const record = `${key}:${content}`
        .match(/.{75}|.+/g)
        .join("\r\n\t")
    return record
}

/**
 * @abstract ICS块对象
 * @extends Map
 */
class ICSBlock extends Map {
    /**
     * 创建ICS块
     * @param { String } name 块的名称
     * @param { Map | Object } map 预定义的键值对
     */
    constructor (name, map = new Map()) {
        super(map instanceof Map ? map : Object.entries(map))
        this.name = name
    }

    /**
     * 重写set方法，接收一或两个参数
     * @param  { [String, String] | [ICSBlock] } args 待添加的键值对或块
     */
    set (...args) {
        if (args.length == 2) { // 在内部新增加一条记录
            const [key, value] = args
            super.set(key, value)
        } else if (args.length == 1) { // 在内部新增加一个块
            if (!(args[0] instanceof ICSBlock)) {
                console.warn("Unexcepted Type of object", args[0])
            }
            super.set(args[0].name + Math.random(), args[0])
        } else {
            console.warn("Unexcepted length of args", args)
        }
    }

    /**
     * 转为ICS文本
     * @returns { String } ICS文本
     */
    toString () {
        const tempList = [`BEGIN:${this.name}`]
        for (const [key, value] of this){
            if (value instanceof ICSBlock) { // 类型为块
                if (!key.startsWith(value.name)) {
                    console.warn("Unexcepted key of ICSBlock", key, value)
                }
                tempList.push(value.toString())
            } else { // 类型为Record
                if (value instanceof Date) { // Date型Record
                    const text = dateToText(value)
                    tempList.push(packetTextRecord(key, text))
                } else { // Text型Record
                    tempList.push(packetTextRecord(key, value))
                }
            }
        }
        tempList.push(`END:${this.name}`)
        return tempList.join("\r\n")
    }
}
/**
 * @author Mapl
 * @file GenICS.js
 * @abstract ICS生成
 * @exports genICS
 * @license GPLv3
 * @version 1.1
 * @date 2021-08-05
 */

/**
 * 计算在经过n天后为哪一天
 * @param { Date } date Date对象
 * @param { Number } slot 经过的天数
 * @returns { Date } 经过n天的Date对象
 */
function getDateAfterDate (date, slot) {
    return (new Date(date)).setDate(date.getDate() + slot)
}

/**
 * 设置指定Date对象的时间
 * @param { Date } date 待设置时间的Date对象
 * @param { String } hmString 时间字符串
 * @returns { Date } 修改后的Date对象
 */
function setDateWithHM (date, hmString) {
    const [hours, min] = hmString.split(":")
    const tempDate = new Date(date)
    tempDate.setHours(hours)
    tempDate.setMinutes(min)
    return tempDate
}

/**
 * 生成RRule
 * @param { Array[Number] } weeklist 周数列表
 * @param { Number } weekday 在周几
 * @param { Date } lastDay 最后一天的Date对象
 * @returns { None | String } RRule字符串
 */
function genRRule (weeklist, weekday, lastDay) {
    const week = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
    if (weeklist.length > 1) {
        const a1 = weeklist[0]
        const a2 = weeklist[1]
        return (
            "FREQ=WEEKLY;INTERVAL=" + (a2 - a1) +
            ";BYDAY=" + week[weekday % 7] +
            `;UNTIL=${dateToText(lastDay)}`)
    }
}

/**
 * 在在校历Map中查找
 * @param { Map } map Map对象
 * @param { [Number, String] } key 待查找的Key
 * @returns { Any } 结构化校历数据
 */
function getMapKeyArrryLike (map, key) {
    for (const [keyM, value] of map) {
        if (keyM[0] === key[0] && keyM[1] === key[1]) {
            return value
        }
    }
}

/**
 * 由课表时间信息生成日历信息
 * @param { Currcourse } Currcourse 课表页面信息
 * @param { Calendar } Calendar 校历页面信息
 * @param { TimeInfo } timeInfo 上课信息
 * @returns { Any } 结构化日历信息
 */
function getCourseDesp (Currcourse, Calendar, timeInfo) {
    // 提取所需信息
    const { year, term, time } = Currcourse
    const { startDate, weekStart } = getMapKeyArrryLike(Calendar, [year, term])
    const { weeklist, weekday, lesson } = timeInfo
    const { start:startTime, end:endTime } = time.get(lesson)

    // 计算课程所在第一天和最后一天
    const offset = (weekday + 7 - weekStart) % 7
    let slot = (weeklist[0] - 1) * 7 + offset
    const firstDay = getDateAfterDate(startDate, slot)
    slot = slot + 7 * (weeklist.slice(-1)[0] - 1)
    const lastDay = getDateAfterDate(startDate, slot)

    // 返回计算所得信息
    return {
        "start" : setDateWithHM(firstDay, startTime),
        "end" : setDateWithHM(firstDay, endTime),
        "rrule" : genRRule(
            weeklist,
            weekday,
            setDateWithHM(lastDay, "23:59")
        )
    }
}

/**
 * 生成ICS文件
 * @param { Currcourse } Currcourse 课表页面信息
 * @param { Calendar } Calendar 校历页面信息
 * @returns { ICSBlock } 结构化ICS文件
 */
function genICS (Currcourse, Calendar) {
    const ics = new ICSBlock("VCALENDAR", { // ICS描述信息
        "VERSION" : "2.0",
        "PRODID" : "-//MaPl//EasyLZU ICS v1.0//ZH",
        "CALSCALE": "GREGORIAN",
        "METHOD" : "PUBLISH",
        "X-WR-CALNAME" : `${Currcourse.year}年${Currcourse.term}学期课表`,
        "X-WR-TIMEZONE" : "Asia/Shanghai",
    })
    for (const course of Currcourse.course) { // 每门课程
        for (const timeInfo of course["上课信息"]) { // 每个时间段
            if (!timeInfo.weeklist || !timeInfo.weekday || !timeInfo.lesson) {
                // 课程时间不完整
                continue
            }
            const {
                start : startTime,
                end : endTime,
                rrule
            } = getCourseDesp(Currcourse, Calendar, timeInfo)
            const event = new ICSBlock("VEVENT", {
                "UID" : (`${course["课程号"]}@${course["课程序号"]}`+
                         "@EasyLZU@1.0"),
                "DTSTAMP" : new Date(),
                "STATUS" : "CONFIRMED",
                "CLASS" : "PRIVATE",
                "SUMMARY" : course["课程名称"],
                "DESCRIPTION" : `任课教师：${course["任课教师"].join("/")}`,
                "LOCATION" : timeInfo.address,
                "DTSTART" : startTime,
                "DTEND" : endTime
            })
            if (rrule) {
                event.set("RRULE", rrule)
            }
            ics.set(event)
        }
    }
    return ics
}
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
const button = modifyHTML()
button.addEventListener("click", (event) => {
    getDOMOfCal().then((calDOM) => {
        const Currcourse = parseDOMOfICS(document)
        const Calendar = parseDOMOfCalendar(calDOM)

        const ics = genICS(Currcourse, Calendar)

        const blob = new Blob([ics.toString()], { type : ICS_MIME})
        downloadBlob(ics.get("X-WR-CALNAME") + ".ics", blob)
    })
})
