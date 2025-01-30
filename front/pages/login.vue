<script setup>
import Button from "~/components/button.vue";
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-[url('public/emergency.jpg')] bg-cover bg-center fade-in">
    <div class="bg-white shadow-md rounded-2xl p-6 w-full max-w-sm">
      <div class="ms-2 me-2 mt-2 mb-4 flex items-center justify-center text-xl">
        <strong>Welcome Back!!!</strong>
      </div>
      <div class="flex flex-col gap-4">
        <div class="flex items-center">
          <svg
            class="pe-2"
            stroke="currentColor"
            fill="#7f7f7f"
            stroke-width="0"
            viewBox="0 0 448 512"
            height="30px"
            width="30px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"
            ></path>
          </svg>
          <input
            type="text"
            placeholder="User"
            class="p-2 rounded-full focus:outline-none focus:bg-blue-100 border-0 w-full"
          />
        </div>
        <div class="flex items-center">
          <svg
            class="pe-2"
            stroke="currentColor"
            fill="#7f7f7f"
            stroke-width="0"
            viewBox="0 0 24 24"
            height="35px"
            width="35px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="none" d="M0 0h24v24H0z"></path>
            <path
              d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
            ></path>
          </svg>
          <input
            type="email"
            placeholder="Email"
            class="p-2 rounded-full focus:bg-blue-100 focus:outline-none border-0 w-100"
          />
        </div>
        <div class="flex items-center">
          <svg
            stroke="currentColor"
            fill="#7f7f7f"
            stroke-width="0"
            viewBox="0 0 24 24"
            height="40px"
            width="40px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="none" d="M0 0h24v24H0V0z"></path>
            <path
              d="M2 17h20v2H2v-2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H5.3l.85-1.47L4.85 7 4 8.47 3.15 7l-1.3.75.85 1.47H1v1.5h1.7l-.85 1.48 1.3.75zm6.7-.75 1.3.75.85-1.48.85 1.48 1.3-.75-.85-1.48H15v-1.5h-1.7l.85-1.47-1.3-.75L12 8.47 11.15 7l-1.3.75.85 1.47H9v1.5h1.7l-.85 1.48zM23 9.22h-1.7l.85-1.47-1.3-.75L20 8.47 19.15 7l-1.3.75.85 1.47H17v1.5h1.7l-.85 1.48 1.3.75.85-1.48.85 1.48 1.3-.75-.85-1.48H23v-1.5z"
            ></path>
          </svg>
          <input
            type="password"
            placeholder="Password"
            class="p-2 rounded-full focus:outline-none focus:bg-blue-100 border-0 w-100"
          />
        </div>
        <Button>
          <svg
            class="me-2"
            stroke="currentColor"
            fill="currentColor"
            stroke-width="0"
            viewBox="0 0 512 512"
            height="25px"
            width="25px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"
            ></path>
          </svg>
          Ready
        </Button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.fade-in {
  animation: fade-in 1s ease-in forwards;
}
</style>