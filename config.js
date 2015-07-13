var loomioDir = process.argv[2] || '/home/mix/projects/loomio';

module.exports = {
  'projectSlug': 'loomio-1',
  'loomioDir': loomioDir,
  'localesDir': loomioDir + '/' + 'config/locales/',

  'resources': [
    {
     transifexSlug: 'main-app-loomio-10',
     localFilePrefix: 'client.',
     commonName: 'main',
    },
    {
     transifexSlug: 'github-linked-version',
     localFilePrefix: '',
     commonName: 'main (old)',
    },
    {
     transifexSlug: 'help-docs',
     localFilePrefix: 'help.',
     commonName: 'help docs',
    },
    {
     transifexSlug: 'frontpageenyml',
     localFilePrefix: 'frontpage.',
     commonName: 'frontpage',
    },
  ],
  'transifexLogin': {
    username: process.env.TRANSIFEX_USERNAME,
    password: process.env.TRANSIFEX_PASSWORD,
  },
}
