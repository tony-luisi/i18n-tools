module.exports = function print(string) {
  string = string.toString()
  process.stdout.write(string)
}

