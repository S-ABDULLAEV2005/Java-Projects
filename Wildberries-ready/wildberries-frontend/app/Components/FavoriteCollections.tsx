"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    FolderHeart,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";

import SavedProductsList from "./SavedProductsList";

import {
    useShopping,
    type SavedItem,
} from "./ShoppingProvider";

import type { SavedProductDetails } from "./SavedProductsPage";

import styles from "./favorite-collections.module.css";

type Collection = {
    id: number;
    name: string;
    itemCount: number;
    items: SavedItem[];
};

async function request<T>(
    path = "",
    method = "GET",
    body?: unknown,
): Promise<T> {
    const response = await fetch(
        `/api/shopping/collections${path}`,
        {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body:
                body === undefined
                    ? undefined
                    : JSON.stringify(body),
            cache: "no-store",
        },
    );

    if (response.status === 401) {
        throw new Error("Please sign in again.");
    }

    if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
            data?.message ||
            data?.detail ||
            `Request failed (${response.status})`,
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export default function FavoriteCollections({
                                                details,
                                            }: {
    details: SavedProductDetails[];
}) {
    const shopping = useShopping();

    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const [editor, setEditor] = useState<
        "create" | number | null
    >(null);

    const [name, setName] = useState("");
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const revision = useRef(0);

    const favoriteSignature = shopping.favorites
        .map((item) => item.id)
        .sort((a, b) => a - b)
        .join(",");

    const load = useCallback(async () => {
        const version = ++revision.current;

        try {
            const data = await request<Collection[]>();

            if (version !== revision.current) return;

            setCollections(data);

            setSelectedId((current) =>
                data.some((item) => item.id === current)
                    ? current
                    : null,
            );

            setLoadError("");
        } catch (failure) {
            if (version === revision.current) {
                setLoadError(
                    failure instanceof Error
                        ? failure.message
                        : "Could not load collections.",
                );
            }
        } finally {
            if (version === revision.current) {
                setLoaded(true);
            }
        }
    }, []);

    useEffect(() => {
        if (!shopping.ready || shopping.loadError) return;

        const version = ++revision.current;

        void request<Collection[]>()
            .then((data) => {
                if (version !== revision.current) return;

                setCollections(data);

                setSelectedId((current) =>
                    data.some((item) => item.id === current)
                        ? current
                        : null,
                );

                setLoadError("");
                setLoaded(true);
            })
            .catch((failure: unknown) => {
                if (version !== revision.current) return;

                setLoadError(
                    failure instanceof Error
                        ? failure.message
                        : "Could not load collections.",
                );

                setLoaded(true);
            });

        return () => {
            revision.current += 1;
        };
    }, [
        shopping.ready,
        shopping.loadError,
        favoriteSignature,
    ]);

    async function run(
        action: () => Promise<unknown>,
        success: string,
    ) {
        if (busy) return;

        setBusy(true);
        setError("");
        setMessage("");

        revision.current += 1;

        try {
            await action();

            setEditor(null);
            setDeleteId(null);
            setMessage(success);

            await load();
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Please try again.",
            );
        } finally {
            setBusy(false);
        }
    }

    const favoriteIds = new Set(
        shopping.favorites.map((item) => item.id),
    );

    const selected = collections.find(
        (item) => item.id === selectedId,
    );

    const deleting = collections.find(
        (item) => item.id === deleteId,
    );

    const count = (collection: Collection) =>
        collection.items.filter(
            (item) => favoriteIds.has(item.id),
        ).length;

    const controlsDisabled =
        busy || !loaded || Boolean(loadError);

    return (
        <>
            <section
                className={styles.panel}
                aria-labelledby="favorite-collections-title"
                aria-busy={busy}
            >
                <div className={styles.heading}>
                    <div>
                        <p className={styles.eyebrow}>
                            Make room for your ideas
                        </p>

                        <h2 id="favorite-collections-title">
                            Your collections
                        </h2>

                        <p>
                            Organize favorites into gift lists,
                            projects, and things you love.
                        </p>
                    </div>

                    <button
                        type="button"
                        className={styles.primary}
                        disabled={controlsDisabled}
                        onClick={() => {
                            setEditor("create");
                            setName("");
                            setDeleteId(null);
                        }}
                    >
                        <Plus size={17} aria-hidden="true" />
                        New collection
                    </button>
                </div>

                {!loaded && (
                    <p role="status">Loading collections…</p>
                )}

                {loadError && (
                    <div role="alert">
                        <p>{loadError}</p>

                        <button
                            type="button"
                            className={styles.secondary}
                            disabled={busy}
                            onClick={() => void load()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {error && (
                    <p role="alert" className={styles.error}>
                        {error}
                    </p>
                )}

                <p role="status" className={styles.notice}>
                    {message || (busy ? "Saving…" : "")}
                </p>

                {editor !== null && (
                    <form
                        className={styles.editor}
                        onSubmit={(event) => {
                            event.preventDefault();

                            void run(
                                () =>
                                    request(
                                        editor === "create"
                                            ? ""
                                            : `/${editor}`,
                                        editor === "create"
                                            ? "POST"
                                            : "PATCH",
                                        { name: name.trim() },
                                    ),
                                editor === "create"
                                    ? "Collection created."
                                    : "Collection renamed.",
                            );
                        }}
                    >
                        <label htmlFor="collection-name">
                            {editor === "create"
                                ? "Collection name"
                                : "New name"}
                        </label>

                        <input
                            id="collection-name"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            maxLength={80}
                            required
                            disabled={busy}
                            placeholder="For example, Gift ideas"
                        />

                        <button
                            className={styles.primary}
                            disabled={busy || !name.trim()}
                            type="submit"
                        >
                            Save
                        </button>

                        <button
                            className={styles.secondary}
                            disabled={busy}
                            type="button"
                            onClick={() => setEditor(null)}
                        >
                            Cancel
                        </button>
                    </form>
                )}

                {deleting && (
                    <div className={styles.confirm}>
                        <p>
                            Delete “{deleting.name}”? Your
                            favorites will stay saved.
                        </p>

                        <button
                            type="button"
                            className={styles.secondary}
                            disabled={busy}
                            onClick={() =>
                                void run(
                                    () =>
                                        request(
                                            `/${deleting.id}`,
                                            "DELETE",
                                        ),
                                    "Collection deleted.",
                                )
                            }
                        >
                            Delete collection
                        </button>

                        <button
                            type="button"
                            className={styles.secondary}
                            disabled={busy}
                            onClick={() => setDeleteId(null)}
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <div
                    className={styles.grid}
                    aria-label="Choose a favorite collection"
                >
                    <button
                        type="button"
                        className={styles.card}
                        aria-pressed={selectedId === null}
                        disabled={busy}
                        onClick={() => {
                            setSelectedId(null);
                            setDeleteId(null);
                            setEditor(null);
                        }}
                    >
                        <FolderHeart
                            size={28}
                            aria-hidden="true"
                        />

                        <strong>All favorites</strong>

                        <span>
                            {shopping.favorites.length} products
                        </span>
                    </button>

                    {collections.map((collection) => (
                        <button
                            key={collection.id}
                            type="button"
                            className={styles.card}
                            aria-pressed={
                                selectedId === collection.id
                            }
                            disabled={controlsDisabled}
                            onClick={() => {
                                setSelectedId(collection.id);
                                setDeleteId(null);
                                setEditor(null);
                            }}
                        >
                            <FolderHeart
                                size={28}
                                aria-hidden="true"
                            />

                            <strong>{collection.name}</strong>

                            <span>
                                {count(collection)} products
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <div className={styles.listHeading}>
                <h2>{selected?.name || "All favorites"}</h2>

                {selected && (
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.secondary}
                            disabled={controlsDisabled}
                            onClick={() => {
                                setEditor(selected.id);
                                setName(selected.name);
                                setDeleteId(null);
                            }}
                        >
                            <Pencil
                                size={15}
                                aria-hidden="true"
                            />
                            Rename
                        </button>

                        <button
                            type="button"
                            className={styles.secondary}
                            disabled={controlsDisabled}
                            onClick={() => {
                                setDeleteId(selected.id);
                                setEditor(null);
                            }}
                        >
                            <Trash2
                                size={15}
                                aria-hidden="true"
                            />
                            Delete collection
                        </button>
                    </div>
                )}
            </div>

            <SavedProductsList
                type="favorites"
                details={details}
                favoriteIds={selected?.items.map(
                    (item) => item.id,
                )}
                renderCollectionControls={(itemId) => (
                    <div className={styles.itemControls}>
                        <select
                            value=""
                            disabled={
                                controlsDisabled ||
                                collections.length === 0
                            }
                            aria-label={`Add ${
                                details.find(
                                    (item) => item.id === itemId,
                                )?.name || "favorite"
                            } to a collection`}
                            onChange={(event) => {
                                const id = Number(
                                    event.target.value,
                                );

                                if (id > 0) {
                                    void run(
                                        () =>
                                            request(
                                                `/${id}/items/${itemId}`,
                                                "PUT",
                                            ),
                                        "Added to collection.",
                                    );
                                }
                            }}
                        >
                            <option value="">
                                Add to collection…
                            </option>

                            {collections.map((collection) => {
                                const included =
                                    collection.items.some(
                                        (item) =>
                                            item.id === itemId,
                                    );

                                return (
                                    <option
                                        key={collection.id}
                                        value={collection.id}
                                        disabled={included}
                                    >
                                        {collection.name}
                                        {included
                                            ? " (saved)"
                                            : ""}
                                    </option>
                                );
                            })}
                        </select>

                        {selected && (
                            <button
                                type="button"
                                className={styles.secondary}
                                disabled={controlsDisabled}
                                onClick={() =>
                                    void run(
                                        () =>
                                            request(
                                                `/${selected.id}/items/${itemId}`,
                                                "DELETE",
                                            ),
                                        "Removed from collection. Still in favorites.",
                                    )
                                }
                            >
                                Remove from collection
                            </button>
                        )}
                    </div>
                )}
            />
        </>
    );
}