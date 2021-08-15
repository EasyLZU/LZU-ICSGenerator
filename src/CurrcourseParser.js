/**
 * @author Mapl
 * @file CurrcourseParser.js
 * @abstract 解析教务系统课表页面
 * @exports parseDOMOfICS
 * @license GPLv3
 * @version 2.0
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
            "课程名称" : row.cells[2].innerText.trim(),
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
