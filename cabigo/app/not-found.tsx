import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <span className={styles.errorCode}>404</span>
                <h1>Page Not Found</h1>
                <p>
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. The
                    page may have been moved or doesn&apos;t exist.
                </p>
                <div className={styles.actions}>
                    <Link href="/" className="btn btn-primary">
                        Go Home
                    </Link>
                    <Link href="/locations" className="btn btn-secondary">
                        View Locations
                    </Link>
                </div>
            </div>
        </div>
    );
}
