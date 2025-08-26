export const theme = {
  colors: {
    primary: '#6200ee',
    secondary: '#03dac6',
    otherColor:'green',
    warning:'yellow',
    background: '#ffffffff', // Fundo escuro para contraste
    surface: 'rgba(255,255,255,0.05)',
    error: '#cf6679',
    text: '#000000ff',
    lightText: 'rgba(255,255,255,0.7)',
    placeholder: 'rgba(0, 0, 0, 0.5)',
    border: 'rgba(38, 0, 95, 0.1)',
    disabled: 'rgba(255,255,255,0.3)',
  },
  tabBar: {
    background: '#ffffff',
    active: '#6200ee',
    inactive: '#757575',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
  radius: {
    small: 4,
    medium: 8,
    large: 16,
  },
  textVariants: {
    title: { fontSize: 24 },
    subtitle: { fontSize: 16 },
    body: { fontSize: 14 },
    button: { fontSize: 16 },
  },
  actions: {
    primary: {
      backgroundColor: '#6200ee',
      color: '#ffffff',
      padding: 12,
      borderRadius: 8,
    },
    edit: {
      backgroundColor: '#03dac6',
      color: '#000000',
    },
    delete: {
      backgroundColor: '#cf6679',
      color: '#ffffff',
      padding: 12,
      borderRadius: 8,
    },
    secondary: {
      backgroundColor: '#03dac6',
      color: '#000000',
      padding: 12,
      borderRadius: 8,
    },
  }
};