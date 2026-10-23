"use client";

import styles from "./dashboardSkeleton.module.css";

export default function DashboardSkeleton() {
  return (
    <div className={styles.scrollComponent}>
      <div className={`${styles.skeletonCard} ${styles.skeletonCreate}`}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonInput} />
        <div className={styles.skeletonButton} />
      </div>

      {[1, 2, 3].map((item) => (
        <div className={styles.skeletonCard} key={item}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonAvatar} />

            <div className={styles.skeletonInfo}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonShortLine} />
            </div>
          </div>

          <div className={styles.skeletonLine} />
          <div className={styles.skeletonShortLine} />

          <div className={styles.skeletonImage} />

          <div className={styles.skeletonActions}>
            <div className={styles.skeletonAction} />
            <div className={styles.skeletonAction} />
            <div className={styles.skeletonAction} />
          </div>
        </div>
      ))}
    </div>
  );
}
