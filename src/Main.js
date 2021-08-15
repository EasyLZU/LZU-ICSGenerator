const button = modifyHTML('课表导出助手')
button.addEventListener("click", (event) => {
    getDOMOfCal().then((calDOM) => {
        const Currcourse = parseDOMOfICS(document)
        const Calendar = parseDOMOfCalendar(calDOM)

        const ics = genICS(Currcourse, Calendar)

        const blob = new Blob([ics.toString()], { type : ICS_MIME})
        downloadBlob(ics.get("X-WR-CALNAME") + ".ics", blob)
    })
})
