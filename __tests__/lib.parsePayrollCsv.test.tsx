import { expect, test } from 'vitest'
import { parsePayrollCsv } from '../lib/parsePayrollCsv'
import fs from "fs";
import path from "path";
 
test('parsePayrollCsv', () => {
  const csv = `
    employee_name,employee_id,level,occupation,week_ending,mon_st_hours,tue_st_hours,wed_st_hours,thu_st_hours,fri_st_hours,sat_st_hours,sun_st_hours,mon_ot_hours,tue_ot_hours,wed_ot_hours,thu_ot_hours,fri_ot_hours,sat_ot_hours,sun_ot_hours,standard_rate,overtime_rate,benefits_rate
    John Doe,12345,APPRENTICE,Carpenter,2024-01-01,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0
  `
  const records = parsePayrollCsv(csv)
  expect(records).toHaveLength(1)
  expect(records[0]).toEqual({
    employee_name: 'John Doe',
    employee_id: 12345,
    level: 'APPRENTICE',
    occupation: 'Carpenter',
    week_ending: '2024-01-01',
    mon_st_hours: 8,
    tue_st_hours: 8,
    wed_st_hours: 8,
    thu_st_hours: 8,
    fri_st_hours: 8,
    sat_st_hours: 8,
    sun_st_hours: 8,
    mon_ot_hours: 0,
    tue_ot_hours: 0,
    wed_ot_hours: 0,
    thu_ot_hours: 0,
    fri_ot_hours: 0,
    sat_ot_hours: 0,
    sun_ot_hours: 0,
    standard_rate: 0,
    overtime_rate: 0,
    benefits_rate: 0,
  })
})

test('parsePayrollCsv with invalid csv', () => {
  const csv = `
    employee_name,employee_id,level,occupation,week_ending,mon_st_hours,tue_st_hours,wed_st_hours,thu_st_hours,fri_st_hours,sat_st_hours,sun_st_hours,mon_ot_hours,tue_ot_hours,wed_ot_hours,thu_ot_hours,fri_ot_hours,sat_ot_hours,sun_ot_hours,standard_rate,overtime_rate,benefits_rate
    John Doe,12345,APPRENTICE,Carpenter,2024-01-01,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0
  `
  const records = parsePayrollCsv(csv)
  expect(records).toHaveLength(0)
})

test('parsePayrollCsv with real csv', () => {
  const csvPath = path.join(process.cwd(), "public", "payroll_data.csv");
  const csv = fs.readFileSync(csvPath, "utf-8");
  const records = parsePayrollCsv(csv);
  expect(records).toHaveLength(263)
})