const tmp = require('./vendor/node_modules/tmp');
const download = require('./vendor/node_modules/download');
const log = require('./vendor/node_modules/logalot');
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const os = require('os');

// Will it compile??
function examine(bin) {
  const file = tmp.fileSync({ postfix: '.nim', prefix: 'nim' });

  const args = [
    'c', '--verbosity:0', '--hints:off', '--warnings:off',
    '--run', file.name
  ];

  try {
    fs.writeSync(file.fd, 'echo "hello world"');
    const stdout = cp.execFileSync(bin, args).toString().trim();
    return stdout === 'hello world';
  } catch (e) {
    return false;
  } finally {
    file.removeCallback();
  }
}

const base = 'https://raw.githubusercontent.com/sheerun/nimjs/master/vendor/';

const data = {
  sources: [
  {
    platform: 'win32',
    arch: 'ia32',
    url: base + 'nim.tar.gz',
    exec: 'build.bat',
    artifact: 'bin/nim.exe'
  },
  {
    platform: 'win32',
    arch: 'x64',
    url: base + 'nim.tar.gz',
    exec: 'build64.bat',
    artifact: 'bin/nim.exe'
  },
  {
    url: base + 'nim.tar.gz',
    exec: 'build.sh',
    artifact: 'bin/nim'
  }
  ],
  binaries: [
    {
      platform: 'darwin',
      arch: 'x64',
      url: base + 'nim-darwin'
    },
    {
      platform: 'win32',
      arch: 'x64',
      url: base + 'nim-win32-x64.exe'
    },
    {
      platform: 'win32',
      arch: 'ia32',
      url: base + 'nim-win32-ia32.exe'
    }
  ]
}

function selectForCurrentOS(entries) {
  const platform = os.platform();
  const arch = os.arch();

  for(let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.platform && entry.platform !== platform) {
      continue;
    }

    if (entry.arch && entry.arch !== arch) {
      continue;
    }

    return entry;
  }
}

async function main() {
  const source = selectForCurrentOS(data.sources);
  const binary = selectForCurrentOS(data.binaries);
  const target = path.join(__dirname, 'bin', os.platform() === 'win32' ? 'nim.exe' : 'nim');

  if (examine(target)) {
    log.success('Nim already installed');
    return 0;
  }

  if (binary) {
    log.info('Downloading pre-compiled nim for current platform...');

    const data = await download(binary.url);

    fs.writeFileSync(target, data);
    fs.chmodSync(target, '777');

    if (examine(target)) {
      log.success('Nim downloaded and verified');
    } else {
      log.warn('Downloaded nim version doesn\'t work...');
    }
  }

  return 0;
}

main().then(process.exit).catch(function (e) {
  log.error(e.message);
  process.exit(1);
})
