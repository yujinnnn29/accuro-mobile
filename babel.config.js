module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { useTransformReactJSXExperimental: true }],
    'nativewind/babel',
  ],
  plugins: [
    'react-native-reanimated/plugin',
  ],
};
