"use client";

import PageErrorState, {
    type PageErrorProps,
} from "./Components/PageErrorState";

export default function ErrorPage(props: PageErrorProps) {
    return <PageErrorState {...props} />;
}