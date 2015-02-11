module.exports = {
  'green': function green(string) { return ("\033[32m"+ string +"\033[0m") },
  'red':   function red(string) { return ("\033[31m"+ string +"\033[0m") },
  'blue':  function blue(string) { return ("\033[36m"+ string +"\033[0m") },
  'bold':  function bold(string) { return ("\033[101m"+ string +"\033[0m") },
}
