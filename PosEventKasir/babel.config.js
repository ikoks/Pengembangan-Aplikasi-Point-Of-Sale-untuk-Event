let plugins = [];
try {
  require.resolve('react-native-dotenv');
  plugins.push([
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env',
      blacklist: null,
      whitelist: null,
      safe: false,
      allowUndefined: true,
    },
  ]);
} catch (_) {}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins,
};


