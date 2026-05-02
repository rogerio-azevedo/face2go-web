export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-full flex-1 items-center justify-center bg-muted/40 p-4">
            {children}
        </div>
    );
}
