//src/components/TechShowcase.jsx
import Image from "next/image";

export default function TechShowcase() {
    return (
        <div className="">
            {/* Top Row: Brand Logos and Products */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
                {/* Brand 1: Google Pixel */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow-md">
                    <div className="relative w-24 h-32">
                        <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-transparent to-vivid-red z-10"></div>
                        <div className="relative flex w-full h-full flex-col items-center space-y-6 p-6">

                            <Image
                                src="/images/pixel-9.png" // Replace with actual image path
                                alt="Google Pixel 9"
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Brand 2: PC Specialist */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow-md">
                    <div className="relative w-24 h-32">
                        <Image
                            src="/images/pc-specialist.png" // Replace with actual image path
                            alt="PC Specialist"
                            layout="fill"
                            objectFit="contain"
                        />
                    </div>
                </div>

                {/* Brand 3: Ninja Shark */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow-md">
                    <div className="relative w-24 h-32">
                        <Image
                            src="/images/ninja-shark.png" // Replace with actual image path
                            alt="Ninja Shark"
                            layout="fill"
                            objectFit="contain"
                        />
                    </div>
                </div>

                {/* Brand 4: Samsung */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow-md">
                    <div className="relative w-24 h-32">
                        <Image
                            src="/images/samsung-watch.png" // Replace with actual image path
                            alt="Samsung Watch"
                            layout="fill"
                            objectFit="contain"
                        />
                    </div>
                </div>

                {/* Brand 5: LG */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow-md">
                    <div className="relative w-24 h-32">
                        <Image
                            src="/images/lg-tv.png" // Replace with actual image path
                            alt="LG UHD TV"
                            layout="fill"
                            objectFit="contain"
                        />
                    </div>
                </div>

                {/* Brand 6: iPhone */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow-md">
                    <div className="relative w-24 h-32">
                        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-transparent to-vivid-red z-10"></div>
                        <div className="relative flex w-full h-full flex-col items-center space-y-6 p-6">
                            {/* <!-- Your iPhone image or content here -->
                            <img src="your-image.jpg" alt="iPhone" className="w-full h-full object-cover"> */}
                            <Image
                                src="/images/iphone.png" // Replace with actual image path
                                alt="iPhone"
                                layout="fill"
                                objectFit="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Device Showcase */}
            <div className="relative flex justify-center items-center">
                <div className="relative w-full max-w-4xl h-[130px] md:h-[300px]">
                    <Image
                        src="/images/device-showcase.png" // Replace with the actual image of the device arrangement
                        alt="Device Showcase"
                        layout="fill"
                        objectFit="contain"
                        className="object-bottom w-full h-full"
                    />
                </div>
            </div>
        </div >
    );
}
