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
