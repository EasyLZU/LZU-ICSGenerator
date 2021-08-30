/**
 * @author Mapl
 * @file GenICS.js
 * @abstract ICS生成
 * @exports genICS
 * @license GPLv3
 * @version 1.2
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
 * 时间Hash
 * @param { Array[Number] } weeklist 周数列表
 * @param { Number } weekday 在周几
 * @param { Date } startTime 起始日期
 * @returns { None | String } 时间Hash字符串
 */
 function genTimeHash (weeklist, weekday, startTime) {
    const week = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
    if (weeklist.length > 1) {
        const a1 = weeklist[0]
        const a2 = weeklist[1]
        return (
            `${a1}-${a2}-${a2-a1}`+
            `${week[weekday % 7]}-${dateToText(startTime)}`)
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
        ),
        "timeHash": genTimeHash(
            weeklist,
            weekday,
            setDateWithHM(firstDay, startTime)
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
                console.dir(course["上课信息"])
                continue
            }
            const {
                start : startTime,
                end : endTime,
                rrule,
                timeHash
            } = getCourseDesp(Currcourse, Calendar, timeInfo)
            const event = new ICSBlock("VEVENT", {
                "UID" : (`${course["课程号"]}@${course["课程序号"]}`+
                         "@EasyLZU@1.0@" + timeHash),
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
