import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import styles from './NotFoundScreen.module.css';

const NotFoundScreen = () => {
  const { colors } = useTheme();

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <h1 
        className={styles.title}
        style={{ color: colors.text }}
      >
        Oops!
      </h1>
      <p 
        className={styles.message}
        style={{ color: colors.textSecondary }}
      >
        This screen doesn't exist.
      </p>
      <Link 
        to="/" 
        className={styles.link}
        style={{ color: colors.primary }}
      >
        Go to home screen!
      </Link>
    </div>
  );
};

export default NotFoundScreen;