"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Unauthenticated } from "convex/react";
import { LayoutDashboard } from "lucide-react";
import { BarLoader } from "react-spinners";
import { useStoreUser } from "@/hooks/use-store-user";
import { Authenticated } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";

const Header = () => {
  const { isLoading } = useStoreUser();
  const path = usePathname();

  return (
    <header className="fixed top-0 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo with animation */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/logo.png"
              alt="Splitr Logo"
              width={200}
              height={60}
              className="h-11 w-auto object-contain"
            />
          </Link>
        </motion.div>

        {/* Links visible only on home page */}
        {path === "/" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden md:flex items-center gap-6"
          >
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-600 transition duration-300 hover:scale-105"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-green-600 transition duration-300 hover:scale-105"
            >
              How It Works
            </Link>
          </motion.div>
        )}

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Authenticated>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4"
            >
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="hidden md:inline-flex items-center gap-2 hover:text-blue-600 hover:border-blue-600 transition-all duration-300 hover:scale-105"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>

                <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </Link>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <UserButton />
              </motion.div>
            </motion.div>
          </Authenticated>

          <Unauthenticated>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3"
            >
              <SignInButton>
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton>
                <Button className="bg-green-600 hover:bg-green-700 border-none transition duration-300 transform hover:scale-105">
                  Get Started
                </Button>
              </SignUpButton>
            </motion.div>
          </Unauthenticated>
        </div>
      </nav>

      {/* Loading Spinner */}
      {isLoading && <BarLoader width="100%" color="#36d7b7" />}
    </header>
  );
};

export default Header;
