var tmp = require('./vendor/node_modules/tmp');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var os = require('os');

// Tells whether nim at some path is working
// Returns either true or false
function test(bin) {
  var file = tmp.fileSync({ postfix: '.nim', prefix: 'nim' });

  var args = [
    'c', '--verbosity:0', '--hints:off', '--warnings:off',
    '--run', file.name
  ];

  try {
    fs.writeSync(file.fd, 'echo "hello world"');
    var stdout = cp.execFileSync(bin, args).toString().trim();
    return stdout === 'hello world';
  } catch (e) {
    return false;
  } finally {
    file.removeCallback();
  }
}

var binaries = {
  current: path.join(__dirname, 'bin', 'nim'),
  darwin: path.join(__dirname, 'bin', 'nim-darwin'),
  win32: path.join(__dirname, 'bin', 'nim-win32'),
  linux: path.join(__dirname, 'bin', 'nim-linux'),
}

function main() {
  if (test(binaries.current)) {
    return;
  }

  var candidate = binaries[os.platform()];

  if (candidate && test(candidate)) {
    fs.createReadStream(candidate).pipe(fs.createWriteStream(binaries.current));
    fs.chmodSync(binaries.current, '755');
  }
}

main()
