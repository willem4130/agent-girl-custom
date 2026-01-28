


export default function HowItWorksSection() {
  return (
    <div className="animate-in fade-in duration-200">
      {/* Hero Section */}
      <section className="flex w-full flex-col self-start rounded-[1.25rem] border border-white/10 bg-black/40 px-8 py-24 backdrop-blur-xl">
        <header className="mb-8">
          <h1 className="font-heading mb-2 text-4xl font-bold text-white uppercase">
            Turn Images Into Video
          </h1>
          <p className="text-sm text-zinc-300">
            Pick a preset or go manual. Camera moves, effects, all that.
          </p>
        </header>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-3 gap-10">
          {/* Card 1 - Add Image */}
          <article>
            <figure
              className="relative mb-4 w-full overflow-hidden rounded-2xl"
              style={{ aspectRatio: "1.31646 / 1" }}
            >
              <img
                src="/video-page/step-1-v2.webp"
                alt="Step 1: Add an image"
                                className="object-cover"
              />
            </figure>
            <h2 className="font-heading mb-2 text-sm font-bold text-white uppercase">
              Add Image
            </h2>
            <p className="text-sm text-zinc-300">
              Upload or generate an image to start your animation
            </p>
          </article>

          {/* Card 2 - Choose Preset */}
          <article>
            <figure
              className="relative mb-4 w-full overflow-hidden rounded-2xl"
              style={{ aspectRatio: "1.31646 / 1" }}
            >
              <video
                src="/video-page/step-2.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </figure>
            <h2 className="font-heading mb-2 text-sm font-bold text-white uppercase">
              Choose Preset
            </h2>
            <p className="text-sm text-zinc-300">
              Pick a preset to control your image movement
            </p>
          </article>

          {/* Card 3 - Get Video */}
          <article>
            <figure
              className="relative mb-4 w-full overflow-hidden rounded-2xl"
              style={{ aspectRatio: "1.31646 / 1" }}
            >
              <video
                src="/video-page/step-3.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </figure>
            <h2 className="font-heading mb-2 text-sm font-bold text-white uppercase">
              Get Video
            </h2>
            <p className="text-sm text-zinc-300">
              Click generate to create your final animated video!
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
