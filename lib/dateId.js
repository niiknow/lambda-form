export default (date) => {
  const today = date.toISOString().slice(0, 16)
  const todayNum = 999999999999 - parseInt(today.replace(/[-T:]+/gi, ''), 10)
  return todayNum.toString()
}
