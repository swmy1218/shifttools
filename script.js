document.getElementById('calculate-button').addEventListener('click', calculateTotalHours);
document.getElementById('calendar-button').addEventListener('click', generateICal);

function calculateTotalHours() {
    const data = document.getElementById('shift-data').value;
    const lines = data.split('\n');
    let totalWorkMinutes = 0;

    lines.forEach(line => {
        console.log("Processing line:", line);  // デバッグメッセージ
        const workMatch = line.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
        if (workMatch && !line.includes('休')) {
            const startTime = workMatch[1].split(':');
            const endTime = workMatch[2].split(':');
            const startHours = parseInt(startTime[0], 10);
            const startMinutes = parseInt(startTime[1], 10);
            const endHours = parseInt(endTime[0], 10);
            const endMinutes = parseInt(endTime[1], 10);
            const start = startHours * 60 + startMinutes;
            const end = endHours * 60 + endMinutes;
            totalWorkMinutes += (end - start);
        } else {
            console.log("Work match failed for line:", line);  // デバッグメッセージ
        }

        if (line.includes('休')) {
            const breakMatch = line.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
            if (breakMatch) {
                const breakStartTime = breakMatch[1].split(':');
                const breakEndTime = breakMatch[2].split(':');
                const breakStartHours = parseInt(breakStartTime[0], 10);
                const breakStartMinutes = parseInt(breakStartTime[1], 10);
                const breakEndHours = parseInt(breakEndTime[0], 10);
                const breakEndMinutes = parseInt(breakEndTime[1], 10);
                const breakStart = breakStartHours * 60 + breakStartMinutes;
                const breakEnd = breakEndHours * 60 + breakEndMinutes;
                totalWorkMinutes -= (breakEnd - breakStart);
            } else {
                console.log("Break match failed for line:", line);  // デバッグメッセージ
            }
        }
    });

    const totalWorkHours = (totalWorkMinutes / 60).toFixed(2);
    document.getElementById('total-work-hours').innerText = totalWorkHours;
}

function generateICal() {
    const data = document.getElementById('shift-data').value;
    const lines = data.split('\n');
    let events = [];
    
    lines.forEach(line => {
        console.log("Processing line for iCal:", line);  // デバッグメッセージ
        const dateMatch = line.match(/(\d{1,2})\/(\d{1,2})\((\w+)\)/);
        const workMatch = line.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
        if (dateMatch && workMatch && !line.includes('休')) {
            const month = dateMatch[1].padStart(2, '0');
            const day = dateMatch[2].padStart(2, '0');
            let year = new Date().getFullYear();

            // 年を調整（年末から年始にかけてのシフト対応）
            const currentMonth = new Date().getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) < 3) {
                year += 1;
            }

            const startHour = workMatch[1].padStart(2, '0');
            const startMinute = workMatch[2].padStart(2, '0');
            const endHour = workMatch[3].padStart(2, '0');
            const endMinute = workMatch[4].padStart(2, '0');
            const startDateTime = `${year}${month}${day}T${startHour}${startMinute}00`;
            const endDateTime = `${year}${month}${day}T${endHour}${endMinute}00`;
            events.push({
                start: startDateTime,
                end: endDateTime,
                summary: "勤務"
            });
        } else {
            console.log("Date or work time not matched for line:", line);  // デバッグメッセージ
        }
    });

    if (events.length === 0) {
        alert("有効なシフトデータがありません。");
        return;
    }

    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Shift Calculator//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";
    events.forEach((event, index) => {
        icsContent += `BEGIN:VEVENT\r\nUID:${Date.now() + index}@shiftcalculator.com\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\nDTSTART;TZID=Asia/Tokyo:${event.start}\r\nDTEND;TZID=Asia/Tokyo:${event.end}\r\nSUMMARY:${event.summary}\r\nEND:VEVENT\r\n`;
    });
    icsContent += "END:VCALENDAR\r\n";

    console.log("Generated ICS Content:\n", icsContent);  // デバッグメッセージ

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // iOSデバイスの場合の処理
    if (navigator.userAgent.match(/(iPhone|iPad|iPod)/i)) {
        window.location.href = url;
    } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shifts.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    URL.revokeObjectURL(url);
}