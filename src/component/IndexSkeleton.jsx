import styles from "./IndexSkeleton.module.css";

export default function SessionSkeleton() {
  return (
    <main className={styles.container}>
      <header className={styles.navbar}>
        <div className={`${styles.skeleton} ${styles.logo}`} />
        <div className={`${styles.skeleton} ${styles.navButton}`} />
      </header>

      <section className={styles.hero}>
        <div className={styles.content}>
          <div className={`${styles.skeleton} ${styles.heading}`} />
          <div className={`${styles.skeleton} ${styles.headingShort}`} />

          <div className={styles.descriptionGroup}>
            <div className={`${styles.skeleton} ${styles.line}`} />
            <div className={`${styles.skeleton} ${styles.line}`} />
            <div className={`${styles.skeleton} ${styles.lineShort}`} />
          </div>

          <div className={`${styles.skeleton} ${styles.joinButton}`} />
        </div>

        <div className={`${styles.skeleton} ${styles.heroImage}`} />
      </section>

      <p className={styles.status}>Checking your session...</p>
    </main>
  );
}
