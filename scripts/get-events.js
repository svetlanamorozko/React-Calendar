'use strict'

import requests from './request.js';

const MS_IN_DAY = 86400000,
      MS_IN_HOUR = 3600000,
      MS_IN_MIN = 6000;

var getEvents = {

    getThisEvents: function(nextProps) {
        var props = nextProps || this.props,
            comparePeriod = this.props.period === props.period;
        if (props.period === 'day') {
            if (!comparePeriod || !nextProps || this.props.day.getTime() !== nextProps.day.getTime()) {
                getEvents.getEventsOfDay.call(this, props);
            }
        } else if (props.period === 'week') {
            let firstDayThisProps = this.props.day.getTime() - this.props.day.getDay() * MS_IN_DAY,
                firstDayNextProps = nextProps ? (nextProps.day.getTime() - nextProps.day.getDay() * MS_IN_DAY) : undefined;
            if (!comparePeriod || !nextProps || firstDayThisProps !== firstDayNextProps) {
                getEvents.getEventsOfWeek.call(this, props, firstDayNextProps);
            }
        } else if (props.period === 'month') {
            if (!comparePeriod || !nextProps || this.props.day.getMonth() !== nextProps.day.getMonth()) {
                getEvents.getEventsOfMonth.call(this, props);
            }
        }
    },


    getEventsOfDay: function(props) {
        var start = props.day.getTime(),
            end = start + MS_IN_DAY - MS_IN_MIN;
        requests.getEvents.call(this, start, end);
    },


    getEventsOfWeek: function(props, dateFirst) {
        var dateLast = dateFirst + 7 * MS_IN_DAY - MS_IN_MIN,
            start = new Date(dateFirst),
            end = new Date(dateLast);

        requests.getEvents.call(this, start, end);
    },


    getEventsOfMonth: function(props) {
        var month = props.day.getMonth(),
            year = props.day.getFullYear(),
            lastDayOfMonth = new Date(year ,month+1, 0).getDate(),
            dateLast = new Date(year, month, lastDayOfMonth),
            DOW_last = dateLast.getDay(),
            dateFirst = new Date(year, month, 1),
            DOW_first = dateFirst.getDay(),
            currDay = dateFirst.getTime() - DOW_first * MS_IN_DAY,
            start = currDay,
            end = dateLast.getTime() + (6 - DOW_last) * MS_IN_DAY;

        var state = this.state;
        state.currDay = currDay;
        state.dateLast = dateLast.getTime();
        this.setState(state);

        requests.getEvents.call(this, start, end);
    },


    sortEvents: function(arr) {
        var arrOfEvents = arr.map(function(value) {
            value.start_date = new Date(value.start_date).getTime();
            value.end_date = new Date(value.end_date).getTime();
            return value;
        });
        arrOfEvents.sort(function(a, b) {
            return a.start_date - b.start_date;
        });
        this.setState({events: arrOfEvents});
    },


    sortDayEventsByHour: function(eventsArr) {
        var arrOfEvents = Array.from({length: 49}),
            midnight = this.props.day.getTime();
        for (let i = 0; i < 49; i ++) {
            let arr
            if (i === 0) {
                arr = eventsArr.filter(function(value) {
                    let start = new Date(value.start_date).getTime(),
                        end = new Date(value.end_date).getTime();
                    return start <= midnight && end >= midnight + MS_IN_DAY;
                });
            } else if (i === 1) {
                arr = eventsArr.filter(function(value) {
                    let start = new Date(value.start_date).getTime(),
                        end = new Date(value.end_date).getTime();
                    return start <= midnight && end < midnight + MS_IN_DAY;
                });
            } else {
                arr = eventsArr.filter(function(value) {
                    let start = new Date(value.start_date).getTime(),
                        currTime = midnight + (i - 1) * MS_IN_HOUR / 2;
                    return start === currTime;
                });
            }
            arrOfEvents[i] = arr;
        };
        this.setState({events: arrOfEvents});
    },


    sortMonthEventsByDays: function(eventsArr) {
        var arrOfEvents = Array.from({length: 7}),
            date = this.props.currDay,
            optionsDate = {year: 'numeric', month: '2-digit', day: '2-digit'};

        for (let i = 0; i < 7; i++) {
            let arr = eventsArr.filter(function(value) {
                let start = new Date(new Date(value.start_date).toLocaleString('en-US', optionsDate)).getTime(),
                    end = new Date(new Date(value.end_date).toLocaleString('en-US', optionsDate)).getTime(),
                    day = new Date(date + i * MS_IN_DAY).getTime();
                return start === day ||
                       end === day ||
                       start < day && end > day;
            });
            arrOfEvents[i] = arr;
        };
        this.setState({events: arrOfEvents});
    }
}


export default getEvents;
