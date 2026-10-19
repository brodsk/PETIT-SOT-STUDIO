"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./not-found.module.css";

export default function NotFound() {
  const pathname = usePathname();
  const isRu = pathname === "/ru" || pathname.startsWith("/ru/");

  return (
    <main className={styles.page}>
      <div className={styles.artMark} aria-hidden="true">
        <span className={styles.orbit} />
        <span className={styles.dot} />
      </div>

      <p className={styles.eyebrow}>PETIT.SOT STUDIO</p>
      <h1 className={styles.code}>404</h1>
      <div className={styles.rule} />

      <h2 className={styles.heading}>
        {isRu ? "Кажется, эта страница потерялась." : "It seems this page got lost."}
      </h2>
      <p className={styles.description}>
        {isRu
          ? "Такой страницы здесь нет — но вы можете вернуться к работам Ольги."
          : "This page isn’t here, but you can return to Olga’s works and explore the collection."}
      </p>

      <div className={styles.actions}>
        <Link className={styles.primary} href={isRu ? "/ru" : "/"}>
          {isRu ? "На главную" : "Back to home"}
          <span aria-hidden="true">↗</span>
        </Link>
        <Link className={styles.secondary} href={isRu ? "/ru/works" : "/works"}>
          {isRu ? "Смотреть работы" : "Explore the works"}
        </Link>
      </div>

      <p className={styles.note}>{isRu ? "ОРИГИНАЛЬНАЯ ЖИВОПИСЬ · ОЛЬГА ТРИХЛЕБ" : "ORIGINAL PAINTINGS · OLGA TRIKHLEB"}</p>
    </main>
  );
}
