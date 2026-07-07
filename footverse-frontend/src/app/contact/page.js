export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

      <div className="space-y-4 text-gray-700">
        <p><strong>Email:</strong> footerse.com</p>
        <p><strong>Phone:</strong> +91 98765 xxxxx</p>
        <p><strong>Address:</strong> Bengaluru, Karnataka, India</p>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Send Message</h2>

        <form className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full border px-4 py-2 rounded-lg"
          />

          <input
            type="email"
            placeholder="Your Email"
            className="w-full border px-4 py-2 rounded-lg"
          />

          <textarea
            placeholder="Your Message"
            className="w-full border px-4 py-2 rounded-lg"
            rows={4}
          />

          <button className="bg-black text-white px-6 py-2 rounded-lg">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}