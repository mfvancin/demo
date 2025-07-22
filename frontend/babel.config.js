module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './app/components',
            '@context': './app/context',
            '@data': './app/data',
            '@navigation': './app/navigation',
            '@screens': './app/screens',
            '@theme': './app/theme',
            '@types': './app/types',
            '@services': './app/services',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      ],
    ],
  };
}; 