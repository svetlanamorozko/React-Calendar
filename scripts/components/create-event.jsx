'use strict'


import React from 'react';
import ReactDOM from 'react-dom';

import CalendarWidget from './calendar-widget.jsx';

import requests from '../requests.js';
import validation from '../validation.js';
import {getDateStr, getTimeStr} from '../viewing-options.js';


const MS_IN_HOUR = 3600000,
      MS_IN_MIN = 60000,
      MS_IN_DAY = 86400000;

let date = new Date(),
    timeZone = date.getTimezoneOffset()*MS_IN_MIN;


const SelectTime = React.createClass({
    render: function() {
        let options = [],
            time = 0,
            timeStr;

        for (let i = 0; i < 48; i++) {
            let minutes = (i % 2 === 0 ? '00' : '30'),
                a = Math.floor(i/2);

            if (a === 0) timeStr = '12:' + minutes + 'am';
            else if (a < 12) timeStr = a + ':' + minutes + 'am';
            else if (a === 12) timeStr = '12:' + minutes + 'pm';
            else if (a > 12) timeStr = a-12 + ':' + minutes + 'pm';

            options.push(<div key={i} className='time' data-time={i * MS_IN_HOUR/2}>{timeStr}</div>);
        }

        return (
            <div>
                {options}
            </div>
        );
    }
});


const CreateEvent = React.createClass({
    getInitialState: function() {
        let state = setState(this.props);
        state.classNone = {};
        return state;
    },

    componentWillReceiveProps: function(nextProps) {
        let state;

        if (nextProps.visible === true) {
            state = setState(nextProps);
        } else {
            state = this.state;
            state.visible = false;
        }

        state.classNone = {};
        this.setState(state);
    },

    handleChange: function(e) {
        let target = e.target,
            state = this.state;
        state.eventData[ target.name] = target.value;
        this.setState(state);
    },

    changeIsRepeatable: function(e) {
        let state = this.state;
        state.eventData.repeat = state.eventData.repeat ? '' : 'repeat';
        this.setState(state);
    },

    handleSubmit: function(e) {
        e.preventDefault();
        let valid = validation.validEventForm.call(this);

        if (valid === false) {
            let state = this.state;
            state.visible = true;
            this.setState(state);
            return;
        } else {
            let eventData = this.state.eventData,
                form = JSON.parse(JSON.stringify(eventData));

            form.start_date = new Date(new Date(eventData.start_date).getTime() + (+this.state.start_time));
            form.end_date = new Date(new Date(eventData.end_date).getTime() + (+this.state.end_time));

            if (eventData.repeat === 'repeat') {
                let duration = this.state.repeat_duration,
                    start = eventData.start_date,
                    repEndDate;

                function repl(match) { return + match + 1; }

                if (duration === 'to date') {
                    repEndDate = new Date(eventData.repeat_end).getTime();
                } else if (duration === 'one week') {
                    repEndDate =  new Date(start).getTime() + MS_IN_DAY * 6;
                } else if (duration === 'one month') {
                    repEndDate = new Date(start.replace(start.slice(0, 2), repl)).getTime();
                } else if (duration === 'one year') {
                    repEndDate = new Date(start.replace(start.slice(-4), repl)).getTime();
                }

                form.repeat_end = new Date(repEndDate + (+this.state.start_time));

            } else {
                form.repeat_rate = undefined;
                form.repeat_end = undefined;
            }

            requests.sendEventForm.call(this.props.scope, form, this.state.id);
        }
    },

    changeVisible: function(e) {
        e.stopPropagation();
        let target = e.target,
            elem = target.previousElementSibling,
            state = JSON.parse(JSON.stringify(this.state));

        elem.focus();

        state.vis = {};
        state.vis[elem.name] = (!this.state.vis[elem.name]);
        state.classNone[elem.name] = true;
        this.setState(state);

        if (elem.name === 'startDate' || elem.name === 'endDate') {
            let className = '.select_' + elem.name.replace('Date', '_date'),
                height = document.querySelector(className + ' .nav-date').offsetHeight;
            document.querySelector(className).style.setProperty('--nav-date-height', height + 'px');
            console.log(height);
        }
    },

    selectStartDate: function(e) {
        e.stopPropagation();
        selectDate.call(this, e.target, 'start_date', 'startDate');
    },

    selectEndDate: function(e) {
        e.stopPropagation();
        selectDate.call(this, e.target, 'end_date', 'endDate');
    },

    selectTime: function(e) {
        e.stopPropagation();
        let target = e.target;
        if (target.className === 'time') {
            let state = this.state,
                changeState = target.parentElement.parentElement.className.slice(7),
                visState = changeState === 'start_time' ? 'startTime' : 'endTime';

            state[changeState] = target.getAttribute('data-time');
            state.vis[visState] = false;
            this.setState(state);
        };
    },

    selectRepeatOptions: function(e) {
        e.stopPropagation();
        let target = e.target;
        if (target.className === 'options') {
            let state = this.state,
                changeState = target.parentElement.className.slice(7),
                visState = changeState === 'repeat_rate' ? 'repRate' : 'repDuration';

            if (changeState === 'repeat_rate') {
                state.eventData[changeState] = target.getAttribute('data-option');
            } else {
                state[changeState] = target.getAttribute('data-option')
            }

            state.vis[visState] = false;
            this.setState(state);
        };
    },

    selectRepeatEnd: function(e) {
        e.stopPropagation();
        selectDate.call(this, e.target, 'repeat_end', 'repEnd');
    },

    hidden: function(e) {
        let state = this.state;
        state.vis = {};
        this.setState(state);
    },

    render: function() {
        let eventData = this.state.eventData;

        return (
            <div className={'event-form' + (this.state.visible ? '' : ' none')} onClick={this.hidden}>
                <form id='event-form' onSubmit={this.handleSubmit}>
                    <div className='title-form'>Create event</div>
                    <label className='title-event'>
                        Title event*
                        <input type='text' name='title' ref='title'
                            value={eventData.title} onChange={this.handleChange} />
                    </label>

                    <div className='category'>
                        <span>Event category*</span>
                        <label>
                            <input name='category' ref='home' type='radio' value='home'
                                checked={eventData.category === 'home'} onChange={this.handleChange} />
                            Home
                        </label>
                        <label>
                            <input name='category' ref='work' type='radio' value='work'
                                checked={eventData.category === 'work'} onChange={this.handleChange} />
                            Work
                        </label>
                    </div>

                    <div className='date-time'>
                        <div className='start'>
                            <label>
                                Start*
                                <input type='text' name='startDate' ref='start_date'
                                    value={eventData.start_date} readOnly onClick={e => e.stopPropagation()}/>
                                <i className='fa fa-chevron-down' aria-hidden='true'
                                    onClick={this.changeVisible} />
                            </label>
                            <label>
                                <input type='text' name='startTime' ref='start_time'
                                    value={eventData ? viewTime(this.state.start_time) : ''} readOnly
                                    onClick={e => e.stopPropagation()} />
                                <i className='fa fa-chevron-down' aria-hidden='true'
                                    onClick={this.changeVisible} />
                            </label>
                        </div>

                        <div className='end'>
                            <label>
                                End*
                                <input type='text' name='endDate' ref='end_date'
                                    value={eventData.end_date} readOnly onClick={e => e.stopPropagation()} />
                                <i className='fa fa-chevron-down' aria-hidden='true'
                                    onClick={this.changeVisible} />
                            </label>
                            <label>
                                <input type='text' name='endTime' ref='end_time'
                                    value={eventData ? viewTime(this.state.end_time) : ''} readOnly
                                    onClick={e => e.stopPropagation()} />
                                <i className='fa fa-chevron-down' aria-hidden='true'
                                    onClick={this.changeVisible} />
                            </label>
                        </div>
                    </div>

                    <div className={'select_start_date' + (this.state.classNone.startDate ? '' : ' hidden')}
                        data-vis={(!this.state.classNone.startDate) ? 'none'
                            : (this.state.vis.startDate) ? 'show-date' : 'hidden-date'}
                        onClick={this.selectStartDate}>
                        <CalendarWidget selDate={new Date(eventData.start_date)} period='day' />
                    </div>
                    <div className={'select_start_time' + (this.state.classNone.startTime ? '' : ' hidden')}
                        data-vis={(!this.state.classNone.startTime) ? 'none'
                            : (this.state.vis.startTime) ? 'show-time' : 'hidden-time'}
                        onClick={this.selectTime}>
                        <SelectTime />
                    </div>

                    <div className={'select_end_date' + (this.state.classNone.endDate ? '' : ' hidden')}
                        data-vis={(!this.state.classNone.endDate) ? 'none'
                            : (this.state.vis.endDate) ? 'show-date' : 'hidden-date'}
                        onClick={this.selectEndDate}>
                        <CalendarWidget selDate={new Date(eventData.end_date)} period='day' />
                    </div>
                    <div className={'select_end_time' + (this.state.classNone.endTime ? '' : ' hidden')}
                        data-vis={(!this.state.classNone.endTime) ? 'none'
                            : (this.state.vis.endTime) ? 'show-time' : 'hidden-time'}
                        onClick={this.selectTime}>
                        <SelectTime />
                    </div>

                    <div className='repeat'>
                        <span>Repeat</span>
                        <input type='checkbox' name='repeat' ref='repeat' value='repeat'
                            checked={eventData.repeat === 'repeat'} onChange={this.changeIsRepeatable}>
                        </input>
                        <div className={'rep-rate' + (eventData.repeat ? '' : ' none')}>
                            <input type='text' name='repRate' ref='repeat_rate'
                                value={eventData.repeat_rate} readOnly />
                            <i className='fa fa-chevron-down' aria-hidden='true'
                                onClick={this.changeVisible} />
                        </div>
                        <div className={'rep-duration' + (eventData.repeat ? '' : ' none')}>
                            <input type='text' name='repDuration' ref='repeat_duration'
                                value={this.state.repeat_duration} readOnly />
                            <i className='fa fa-chevron-down' aria-hidden='true'
                                onClick={this.changeVisible} />
                        </div>
                        <div className={'rep-end' + (this.state.repeat_duration === 'to date' ? '' : ' none')}>
                            <input type='text' name='repEnd' ref='repeat_end'
                                value={eventData.repeat_end} readOnly />
                            <i className='fa fa-chevron-down' aria-hidden='true'
                                onClick={this.changeVisible} />
                        </div>
                    </div>

                    <div className={'select_repeat_rate' + (this.state.vis.repRate ? '' : ' none')}
                        onClick={this.selectRepeatOptions}>
                        <div className='options' data-option='every day'>every day</div>
                        <div className='options' data-option='every week'>every week</div>
                        <div className='options' data-option='every month'>every month</div>
                    </div>

                    <div className={'select_repeat_duration' + (this.state.vis.repDuration ? '' : ' none')}
                        onClick={this.selectRepeatOptions}>
                        <div className='options' data-option='one week'>one week</div>
                        <div className='options' data-option='one month'>one month</div>
                        <div className='options' data-option='one year'>one year</div>
                        <div className='options' data-option='to date'>to date</div>
                    </div>

                    <div className={'select_repeat_end' + (this.state.vis.repEnd ? '' : ' none')}
                        onClick={this.selectRepeatEnd}>
                        <CalendarWidget selDate={new Date(eventData.repeat_end)} period='day' />
                    </div>

                    <label className='place'>
                        Place
                        <input type='text' name='place' ref='place'
                            value={eventData.place}
                            onChange={this.handleChange} />
                    </label>

                    <label className='description'>
                        Description
                        <textarea name='description' ref='description'
                            value={eventData.description}
                            onChange={this.handleChange}></textarea>
                    </label>

                    <div className='error'>
                        <div className={'err' + (this.state.invalid ? '' : ' none')}>
                            <i className='fa fa-exclamation-triangle' aria-hidden='true' />
                            {this.state.invalid}
                        </div>
                    </div>

                    <div className='button-block'>
                        <button type='submit' className='button create'>Save</button>
                        <button type='reset' className='button create'>Cancel</button>
                    </div>
                </form>
            </div>
        );
    }
});


function setState(props) {
    let ev = props.editableEvent,
    start = ev ? new Date(ev.start_date) : date,
    end = ev ? new Date(ev.end_date) : date,
    repeat = ev && ev.repeat_end ? new Date(ev.repeat_rate) : new Date(date.getTime() + 6 * MS_IN_DAY),
    startDate = getDateStr(start),
    endDate = getDateStr(end),
    repeatEnd = getDateStr(repeat);

    return {
        visible: props.visible,
        id: ev ? ev.id : undefined,
        vis: {},
        eventData: {
            title: ev ? ev.title : '',
            start_date: startDate,
            end_date: endDate,
            place: ev ? ev.place : '',
            category: ev ? ev.category : '',
            description: ev ? ev.description : '',
            repeat: ev ? ev.is_repeat : '',
            repeat_rate: ev && ev.repeat_rate ? ev.repeat_rate : 'every day',
            repeat_end: repeatEnd
        },
        start_time: ev ? ev.start_date - new Date(startDate).getTime() : '',
        end_time: ev ? ev.end_date - new Date(endDate).getTime() : '',
        repeat_duration: ev && ev.repeat_duration ? ev.repeat_duration : 'one week',
        invalid: ''
    };
}


function selectDate(target, changeState, visState) {
    if (target.className.indexOf('curr-month') >= 0
        || target.className.indexOf('other-month') >= 0) {

        let state = this.state,
            selDate = new Date(+target.id);

        state.eventData[changeState] = getDateStr(selDate);
        state.vis[visState] = false;
        this.setState(state);
    };
}


function viewTime(time) {
    let selTime = new Date(+time + timeZone),
        timeStr = getTimeStr(selTime);

    return timeStr;
}


export default CreateEvent;
