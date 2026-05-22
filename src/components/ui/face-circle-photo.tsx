"use client";

export type FaceCirclePhotoProps = {
    photoUrl: string | null;
    nameHint: string | null;
    className?: string;
};

/** Foto pré-assinada (R2) — usa `<img>` (URLs variadas); não usar next/image aqui. */
export function FaceCirclePhoto(props: FaceCirclePhotoProps) {
    const initial =
        props.nameHint?.trim()?.charAt(0)?.toUpperCase() ?? "?";
    return (
        <div className={props.className}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {props.photoUrl ? (
                <img
                    alt=""
                    src={props.photoUrl}
                    className="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => {
                        console.error("[FaceCirclePhoto] falha ao carregar", {
                            nameHint: props.nameHint,
                            photoUrl: props.photoUrl,
                        });
                    }}
                />
            ) : (
                <span className="flex size-full items-center justify-center font-bold uppercase text-teal-600">
                    {initial}
                </span>
            )}
        </div>
    );
}
