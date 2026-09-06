import Image from "next/image";

export default function Logo() {
    return (
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#35145f]/10">
            <Image
                src="/Hovuca-croped.png"
                alt="HOVUCA logo"
                width={40}
                height={40}
                className="object-contain w-auto h-auto"
            />
        </div>
    )
}
