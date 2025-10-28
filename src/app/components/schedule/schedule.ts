import { Component } from "@angular/core";

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.html',
})

export class ScheduleComponent {

  TIME_SLOTS = [{start: '7:00',  end: '7:45' }, {start: '7:45',  end: '8:30' }, {start: '8:30',  end: '9:15' }, {start: '9:15',  end: '10:00'},
                {start: '10:00', end: '10:45'}, {start: '10:45', end: '11:30'}, {start: '11:30', end: '12:15'}, {start: '12:15', end: '13:00'},
                {start: '13:00', end: '13:45'}, {start: '13:45', end: '14:30'}, {start: '14:30', end: '15:15'}, {start: '15:15', end: '16:00'},
                {start: '16:00', end: '16:45'}, {start: '16:45', end: '17:30'}, {start: '17:30', end: '18:15'}, {start: '18:15', end: '19:00'},
                {start: '19:00', end: '19:45'}, {start: '19:45', end: '20:30'}, {start: '20:30', end: '21:15'}, {start: '21:15', end: '22:00'},
                {start: '22:00', end: '22:45'}];

  checkSlot(start: string, end: string, day: string): any {
    for (const group of this.selectedgroups) {
      const groupData = this.data.flatMap(subject => subject.groups).find((g: any) => g.id === group);
      if (groupData) {
        for (const timeslot of groupData.timeslots) {
          if (this.formatForComparison(timeslot.startTime) <= this.formatForComparison(start) && this.formatForComparison(timeslot.endTime) >= this.formatForComparison(end) && this.formatDay(timeslot.day) === day) {
            const subject = this.data.find(sub => sub.groups.some((g: any) => g.id === group));
            return subject;
          }
        }
      }
    }
    return null;
  }

  formatForComparison(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

}
