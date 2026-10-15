"use client";

import PageErrorState, {
    type PageErrorProps,
} from "../Components/PageErrorState";

export default function AlifErrorPage(props: PageErrorProps) {
    return <PageErrorState {...props} alif />;
}