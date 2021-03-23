import * as xmlParser from 'js2xmlparser'
import moment from 'moment'
import { parse } from '@fast-csv/parse'
import fs from 'fs'


const Project = {
  '@': {
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema'
  },
  Name: 'Проектище',
  Author: 'Дядя Вася',
  SaveVersion: '11',
  ProjectExternallyEdited: '0',
  CreationDate: moment().format('YYYY-MM-DDTHH:mm:ss'),
  LastSaved: moment().format('YYYY-MM-DDTHH:mm:ss'),
  StartDate: moment().add(1, 'd').format('YYYY-MM-DDTHH:mm:ss'),
  FinishDate: moment().add(4, 'd').format('YYYY-MM-DDTHH:mm:ss'),
  CurrentDate: moment().format('YYYY-MM-DDTHH:mm:ss'),
  CalendarUID: '1',
  ScheduleFromStart: '0',
  HonorConstraints: '0',
  WorkFormat: '5',
  DurationFormat: '5',
  Calendars: '',
  Tasks: {
    Task: []
  }
}

const Task = {
  UID: '1',
  ID: '1',
  Type: '2',
  IsNull: '0',
  HideBar: '0',
  Summary: '0',
  IsSubproject: '0',
  WBS: '1',
  OutlineLevel: '1',
  ConstraintType: '1',
  EffortDriven: '0',
  Milestone: '0',
  Name: 'Пустое имя',
  FixedCostAccrual: '3',
  Work: '',
  Duration: 'PT0H0M0S',
  DurationFormat: '21',
  Start: '',
  Finish: ''
}

const PredecessorLink = {
  PredecessorUID: '1',
  Type: '1',
  CrossProject: '0',
  LinkLag: '0',
  LagFormat: '7'
}

const parsedDataRows = []

const parseDataRow = (row) => {
  parsedDataRows.push(row)
}

const onDataEnd = (rowCount) => {
  let taskIndex = 1
  for (let i = 0; i < parsedDataRows.length; i++) {
    const row = parsedDataRows[i]
    const newTask = { ...Task }

    newTask.UID = taskIndex
    newTask.ID = taskIndex
    newTask.Name = `${row.name} (${row.code})`
    // Convert hours to format like PThHmMsS (ISO 8601 duration)
    let duration = moment.duration(row.duration, 'h')
    newTask.Duration = `PT${duration.hours()}H${duration.minutes()}M${duration.seconds()}S`

    Project.Tasks.Task.push(newTask)
    taskIndex++

    if (row.type === 'С') {
      const subTask1 = { ...Task }
      subTask1.OutlineLevel = '2'
      subTask1.Name = `Сборка деталей для ${row.code}`
      subTask1.UID = taskIndex
      subTask1.ID = taskIndex
      duration = moment.duration(row.duration / 2, 'h')
      subTask1.Duration = `PT${duration.hours()}H${duration.minutes()}M${duration.seconds()}S`

      Project.Tasks.Task.push(subTask1)
      taskIndex++

      const subTask2 = { ...Task }
      subTask2.OutlineLevel = '2'
      subTask2.Name = `Установка деталей для ${row.code}`
      subTask2.UID = taskIndex
      subTask2.ID = taskIndex
      duration = moment.duration(row.duration / 2, 'h')
      subTask2.Duration = `PT${duration.hours()}H${duration.minutes()}M${duration.seconds()}S`
      subTask2.PredecessorLink = {
        ...PredecessorLink,
        PredecessorUID: subTask1.UID
      }

      Project.Tasks.Task.push(subTask2)
      taskIndex++
    } else {
      const subTask1 = { ...Task }
      subTask1.OutlineLevel = '2'
      subTask1.Name = `Получение заготовки для ${row.code}`
      subTask1.UID = taskIndex
      subTask1.ID = taskIndex
      duration = moment.duration(row.duration / 3, 'h')
      subTask1.Duration = `PT${duration.hours()}H${duration.minutes()}M${duration.seconds()}S`

      Project.Tasks.Task.push(subTask1)
      taskIndex++

      const subTask2 = { ...Task }
      subTask2.OutlineLevel = '2'
      subTask2.Name = `Механообработка ${row.code}`
      subTask2.UID = taskIndex
      subTask2.ID = taskIndex
      duration = moment.duration(row.duration / 3, 'h')
      subTask2.Duration = `PT${duration.hours()}H${duration.minutes()}M${duration.seconds()}S`
      subTask2.PredecessorLink = {
        ...PredecessorLink,
        PredecessorUID: subTask1.UID
      }

      Project.Tasks.Task.push(subTask2)
      taskIndex++

      const subTask3 = { ...Task }
      subTask3.OutlineLevel = '2'
      subTask3.Name = `Слесарные операции ${row.code}`
      subTask3.UID = taskIndex
      subTask3.ID = taskIndex
      duration = moment.duration(row.duration / 3, 'h')
      subTask3.Duration = `PT${duration.hours()}H${duration.minutes()}M${duration.seconds()}S`
      subTask3.PredecessorLink = {
        ...PredecessorLink,
        PredecessorUID: subTask2.UID
      }

      Project.Tasks.Task.push(subTask3)
      taskIndex++
    }

    if (i < parsedDataRows.length) {
      newTask.PredecessorLink = {
        ...PredecessorLink,
        PredecessorUID: taskIndex
      }
    }
  }

  const outputXml = xmlParser.parse('Project', Project)
  console.log(outputXml)
  fs.writeFileSync('output.xml', outputXml)
}

// Setup csv parser stream
const stream = parse({ headers: ['type', 'name', 'code', 'count', 'duration'], renameHeaders: true, trim: true })
  .on('error', error => console.error(error))
  .on('data', parseDataRow)
  .on('end', onDataEnd)
// Read file to parser stream
fs.readFile('./testdata.csv', 'utf8', (error, data) => {
  console.log(data)
  stream.write(data)
  stream.end()
})



