/**
 * AvatarDetails Component
 *
 * This component displays detailed information about a user's avatar including:
 * - Avatar image visualization
 * - Detected outfit items with similarity matching
 * - Product recommendations and purchase links
 * - User actions like editing avatar or saving outfits
 *
 * It integrates with a backend API for outfit detection using CLIP similarity search.
 */

import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import avatarShirt from "../assets/avatar-shirt.png";
import avatarPant from "../assets/avatar-pant.png";
import avatarShoes from "../assets/avatar-shoes.png";
import { useLocation } from "react-router-dom";

// Type definitions for outfit items
type OutfitItem = {
  id: string;
  part: string; // Shirt, Pant, Shoes, etc.
  title: string;
  description: string;
  size: string;
  occasion: string;
  fabric: string;
  price: string;
  purchaseLink?: string;
  image?: string;
};

// Mock data for fallback outfit items
const MOCK_OUTFIT: OutfitItem[] = [
  {
    id: "o1",
    part: "Shirt",
    title: "Silk Printed Shirt",
    description:
      "Lightweight silk shirt with all-over tonal print and refined collar.",
    size: "M",
    occasion: "Formal / Evening",
    fabric: "Silk Blend",
    price: "$89",
    purchaseLink: "#",
    image: avatarShirt,
  },
  {
    id: "o2",
    part: "Pant",
    title: "Tailored Wool Trouser",
    description: "Slim-fit wool trousers with tapered leg and subtle crease.",
    size: "32",
    occasion: "Formal",
    fabric: "Wool",
    price: "$129",
    purchaseLink: "#",
    image: avatarPant,
  },
  {
    id: "o3",
    part: "Shoes",
    title: "Leather Derby Shoes",
    description: "Hand-finished derby shoes with comfortable cushioned insole.",
    size: "9 US",
    occasion: "Formal / Party",
    fabric: "Leather",
    price: "$199",
    purchaseLink: "#",
    image: avatarShoes,
  },
  //   {
  //     id: 'o4',
  //     part: 'Accessories',
  //     title: 'Slim Leather Belt',
  //     description: 'Minimal leather belt with stainless buckle.',
  //     size: 'One size',
  //     occasion: 'All',
  //     fabric: 'Leather',
  //     price: '$39',
  //     purchaseLink: '#',
  //     image: '/assets/avatar-accessories.png',
  //   },
];

const ASSET_IMAGE_LIBRARY: Array<{
  asset_id: string;
  image: string;
  link: string;
  asset_images?: string[]; //optional field for multiple images per asset
  assets_links?: string[]; //optional field for multiple links per asset
}> = [
  {
    asset_id: "id_006",
    image:
      "https://mendeez.com/cdn/shop/files/bernice-crew-neckt-shirtsmendeez-pk-0011652-843938_3af44650-3570-4539-a4d5-cb28c65504f0.jpg?v=1756381190&width=900",
    link: "https://mendeez.com/products/crew-neck-t-shirt-maroon?srsltid=AfmBOor1CcwOQoeQQmUb4qfpHfbAn6J-t7x-hsH8tkBVZhh9EYReKnQK",
  },
  {
    asset_id: "id_004",
    image:
      "https://mendeez.com/cdn/shop/products/cardigan-blue-all-day-pantsjogger-pantsmendeez-pk-0011347-640320.png?v=1756381666&width=900",
    link: "https://mendeez.com/collections/mens-pants/products/all-day-pants-navy-blue",
  },
  {
    asset_id: "id_002",
    image: "https://m.media-amazon.com/images/I/51ZF0kDULbL._SY741_.jpg",
    link: "https://www.amazon.in/Zavera-Womens-Winter-Embroidery-Mustard/dp/B0CPLNT1KK/ref=sr_1_10?dib=eyJ2IjoiMSJ9.9mr8t9bU8XoOZLWPZR0wMaPm4rta1Mk2XHqdvKUBX8dJWVQEUJ2yHiRpf8HRIk9kCKVArD44fVij-moPQeAzfgB5lYO23zujdXd2ZwOyRCZTiBAp2cZxUzxnpMyrn1rFRoBHMXQd3OoEqRLq_jLyB9DZCQpNyMFzUbyg4MmjCR8JAuxlhVCn-9gkl9W8f340g0ahgGCbjmuvfcOy3fOX-FGvI4y4BCkGeW8vTn3nt95TnBtRBFPNn3jMx5_6AFX25Af-ZtX9j8lckUWqMDrjMjQ1gUDXFaLiRoWlxujerH4.deen_sjM7Z4cBQnf2Vn6iUoqUCqrUa_ZZNmfZX2cwtg&dib_tag=se&keywords=woolen%2Bkurti%2Bunder%2B500&qid=1779131436&sr=8-10&th=1&psc=1",
  },
   {
    asset_id: "id_005",
    image: "https://i5.walmartimages.com/seo/kamemir-Mens-Jackets-Lightweight-Men-s-Casual-Shirt-Jacket-Cotton-Linen-Shacket-Lightweight-Work-Coat-Button-Down-Overshirt-Light-Gray-S_fa0ac432-01e5-47c0-b101-8189913238e6.9c1bad11a6c63607286305a4a84e3f1d.jpeg?odnHeight=2000&odnWidth=2000&odnBg=FFFFFF",
    link: "https://www.walmart.com/ip/kamemir-Mens-Jackets-Lightweight-Men-s-Casual-Shirt-Jacket-Cotton-Linen-Shacket-Lightweight-Work-Coat-Button-Down-Overshirt-Light-Gray-S/9212170581",
  },
  {
    asset_id: "id_011",
    image: "https://content.purecollection.com/img/b/319619_mk315_heathergrey_m_5.jpg",
    link: "https://www.purecollection.com/mens/sweaters-and-jumpers/mens-cashmere-v-sweater-grey-6393",
  },
  {
    asset_id: "id_007",
    image: "https://www.shaliniguptastudio.com/cdn/shop/products/DSC_5121.jpg?v=1681565002&width=990",
    link: "https://www.shaliniguptastudio.com/products/regal-black-hand-embroidered-yoke-kurti-set?srsltid=AfmBOoo_y0i4-0IUpV28fZZ62u4SmVwUAKf7SBitRcTVcKQ14M8SBuIU",
  },
   {
    asset_id: "id_003",
    image: "https://outfitters.com.pk/cdn/shop/files/F0646109618_2_copy.jpg?v=1776836817",
    link: "https://outfitters.com.pk/collections/men-denim-collection/products/f0646-109?variant=45167664660671",
  },
  {
    asset_id: "id_010",
    image:
      "https://charcoal.com.pk/cdn/shop/files/DSC05540.jpg?v=1757311125&width=1200",
    link: "https://charcoal.com.pk/products/officer-coat-black-copy?srsltid=AfmBOooig-Tk-Qngh5XGIB77xvVS_WLCYtosY-B486E_9mckoPB0-AhU",
    asset_images: [
      "https://m.media-amazon.com/images/I/61Y+m0ij4nL._SX679_.jpg",
      "https://insignia.com.pk/cdn/shop/files/I53088_BLACK_cdfaec09-4fd9-4191-b5f8-ffda60611c41.jpg?v=1760362707&width=990",
    ],
    assets_links: [
      "https://www.amazon.in/MALENO-Stylish-Slim-Solid-Trouser/dp/B09NQK9PF3?th=1&psc=1",
      "https://insignia.com.pk/products/formal-long-shoes-i53088-black?srsltid=AfmBOorsXUK9q-chMQ0r7WHz_GXa3F3wMUpuCimG702GgYqu9WEmgEXE",
    ],
  },
   {
    asset_id: "id_009",
    image:
      "https://www.hancockfashion.com/cdn/shop/files/16083SBlueS_1.jpg?v=1734412813&width=1080",
    link: "https://www.hancockfashion.com/products/hancock-women-sky-blue-solid-pure-cotton-regular-fit-formal-shirt-16083sblue?srsltid=AfmBOor-aNBKfeYgQgZhr8HcsElp4j9gMiEaHuBY7vt6pzAqtW-jRreW",
    asset_images: [
      "https://nivafh.com/wp-content/uploads/2024/09/07_2a295247-78e8-4d55-b24e-622559f80fe5.jpg",
      "https://walkeaze.com/cdn/shop/files/women-formal-loafer-40985s-walkeaze-7767257_510x.progressive.png.jpg?v=1764712625",
    ],
    assets_links: [
      "https://nivafh.com/product/sophia-black-formal-pants/?srsltid=AfmBOoo2Lo_c_rDr-_3y0nUcK2-lKEqV3Xp_WJD67IICTK3j4b4sw56U",
      "https://walkeaze.com/products/40985s-loaffers?srsltid=AfmBOooCMM6pDwsJF7L-cb3izERWG3jsCUAnNEejbBj9zBAbPnwFuLCd",
    ],
  },
  {
    asset_id: "id_012",
    image: "https://shirttoshoe.com/cdn/shop/files/simple_ehite.jpg?crop=center&height=1500&v=1720882228&width=1500",
    link: "https://shirttoshoe.com/products/mens-plain-white-t-shirt",
    asset_images: [
      "https://wrogn.com/cdn/shop/files/1_6b8140c5-6f1f-4483-9452-2c5fa2f45e09.jpg?v=1749210688&width=360",
      "https://img4.dhresource.com/webp/m/0x0/f3/albu/ys/y/01/da88546d-0e50-4b52-a443-d82335714fc7.jpg",
    ],
    assets_links: [
      "https://wrogn.com/products/dark-blue-slim-fit-denim-jeans",
      "https://www.dhgate.com/product/top-luxury-elegant-designer-prax-01-men-sneakers/1060005925.html?skuId=1389790230617276432"
    ],
  },
  {
    asset_id: "id_013",
    image: "https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/bf8e5ab9-f937-4d85-9e54-ad7d949db7e2/CC+U+NK+FLC+PO+HOODIE+ESS.png",
    link: "https://www.nike.com/t/caitlin-clark-basketball-phoenix-fleece-pullover-hoodie-95Cdy2t4/IQ5642-063",
    asset_images: [
      "https://outfitters.com.pk/cdn/shop/files/F0654109903_1.jpg?v=1776746184&width=493",
      "https://keeshoes.com/a/ale/auction_image/image1_119132.s790/joker-mens-leather-casual-shoes-521-2-white-790x790.jpeg?_=1650487032.49444941",
    ],
    assets_links: [
      "https://outfitters.com.pk/collections/men-denim-collection/products/f0654-109",
      "https://keeshoes.com/mens-leather-casual-shoes-521-2-white-joker-white-i119132.html"
    ],
  },
     {
    asset_id: "id_008",
    image: "https://cdn.modaoperandi.com/assets/images/products/1057745/705435/large_staud-yellow-garden-dress.jpg?_v=0",
    link: "https://www.modaoperandi.com/women/p/staud/garden-dress/705435",
    asset_images: [
      "https://img.joomcdn.net/65c4876bcdbe45bd4fcbd33d2ef5473dc614f3bf_original.jpeg",
    ],
    assets_links: [
      "https://www.joom.com/en/products/64a399ca167c71015a843148?srsltid=AfmBOooBs6rdUaLN3-rOsD3Hm8WsNPnjtpCXT1XiqFs86Qb5zaLCmgWw",
    ],
  }
  // Add more asset_id -> image mappings as needed.
];

const ASSET_IMAGE_MAP = ASSET_IMAGE_LIBRARY.reduce(
  (map, item) => ({ ...map, [item.asset_id.toLowerCase()]: item.image }),
  {} as Record<string, string>,
);

const ASSET_LINK_MAP = ASSET_IMAGE_LIBRARY.reduce(
  (map, item) => ({ ...map, [item.asset_id.toLowerCase()]: item.link }),
  {} as Record<string, string>,
);

const getAssetIdFromDescription = (description?: string | null) => {
  if (!description) return null;

  const match = description.match(/id_[0-9]+/i);
  return match ? match[0].toLowerCase() : null;
};

const resolveAssetId = (assetId?: string | null, description?: string | null) =>
  assetId?.toLowerCase() || getAssetIdFromDescription(description);

const resolveAssetImage = (
  assetId?: string | null,
  description?: string | null,
  fallback?: string,
) => {
  const id = resolveAssetId(assetId, description);
  return id && ASSET_IMAGE_MAP[id] ? ASSET_IMAGE_MAP[id] : fallback;
};

const resolveAssetLink = (
  assetId?: string | null,
  description?: string | null,
) => {
  const id = resolveAssetId(assetId, description);
  return id && ASSET_LINK_MAP[id] ? ASSET_LINK_MAP[id] : "#";
};

const AvatarDetails: React.FC = () => {
  // Get avatar ID from navigation state
  const location = useLocation();
  const avatarId = location.state?.avatarId;
  const token = location.state?.token; // Assuming token is also passed in state
  // const avatarId = "b1KShOCip64fP6JT37v4";
    // const avatarId = "utsJR6SRjSCrHDVL2XuZ";
  // let token =
  //   "client_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6ImNsaWVudF9RamZoaG1FVWE0WVVJU3JjSEJ1TzhXVzVpd04yIiwidXNlcklkIjoidXNlcl83ODkiLCJ1c2VyTmFtZSI6IkpvaG4gRG9lIiwicGxhbiI6IkZSRUUiLCJpYXQiOjE3Nzk0NzM1Mjd9.ddCoNcSnEHj0qFA5IPl4a3eFPW3xgMqORORyhelJ2NI";

  // Construct avatar URL using Ready Player Me service
  // const avatarUrl = `https://models.readyplayer.me/${avatarId}.png?camera=fullbody`;
  const avatarUrl = `https://glb.streamoji.com/api/render-thumbnail?avatarId=${avatarId}`;

  // State for detected outfit items
  const [detected, setDetected] = useState<Record<string, any>>({});
  const [loadingDetected, setLoadingDetected] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(avatarUrl);
  const [progress, setProgress] = useState(0);

  // Helper function to get the best match by type from detection results
  const getBestByType = (results: any[], type: string) => {
    const list = results.filter(
      (r) => r.type?.toLowerCase() === type.toLowerCase(),
    );
    if (list.length === 0) return null;
    return list.reduce(
      (best, cur) => (cur.confidence > (best.confidence ?? 0) ? cur : best),
      list[0],
    );
  };

  const getMaxByType = (results: any[], type: string) =>
    results
      .filter((r) => r.type === type && r.position !== null)
      .sort((a, b) => b.confidence - a.confidence)[0] || null;

  const getBestOutfitOrParts = (results: any[]) => {
    const outfits = results
      .filter((r) => r.type === "outfit" && r.position !== null)
      .sort((a, b) => b.confidence - a.confidence);
    if (outfits.length > 0) {
      // Only accept the "outfit" result when individual parts are NOT strong matches.
      // If any of shirt/pant/shoe has a strong match (>= THRESHOLD), prefer returning parts.
      const THRESHOLD = 0.65;
      const bestShirt = getMaxByType(results, "shirt");
      const bestPant = getMaxByType(results, "pant");
      const bestShoe = getMaxByType(results, "shoe");

      const shirtGood = Boolean(
        bestShirt && (bestShirt.confidence ?? 0) >= THRESHOLD,
      );
      const pantGood = Boolean(
        bestPant && (bestPant.confidence ?? 0) >= THRESHOLD,
      );
      const shoeGood = Boolean(
        bestShoe && (bestShoe.confidence ?? 0) >= THRESHOLD,
      );

      // If none of the individual parts are strong, return the outfit. Otherwise let caller
      // handle individual-part detection by returning null/undefined.
      if (
        (shirtGood || pantGood || shoeGood) &&
        outfits[0]?.confidence >= THRESHOLD
      ) {
        return { outfit: outfits[0] }; // ONLY ONE
      } else if (!shirtGood && !pantGood && !shoeGood) {
        return { outfit: outfits[0] }; // ONLY ONE
      }
    }

    return null;
  };

  // Effect to detect outfit items when component mounts
  // useEffect(() => {
  //   const run = async () => {
  //     setLoadingDetected(true);
  //     setDetectError(null);
  //     setProgress(0);
  //     const startTime = Date.now();
  //     const interval = setInterval(() => {
  //       const elapsed = (Date.now() - startTime) / 1000; // seconds
  //       let newProgress = (elapsed / 60) * 100;
  //       if (newProgress >= 100) {
  //         newProgress = 100;
  //         clearInterval(interval);
  //       } else if (elapsed > 60 && newProgress >= 95) {
  //         newProgress = 95;
  //         clearInterval(interval);
  //       }
  //       setProgress(newProgress);
  //     }, 100);

  //     try {
  //       // Call backend API for outfit detection using CLIP similarity
  //       const res = await fetch('http://localhost:5000/similarity/clip', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ avatarUrl }),
  //       });
  //       if (!res.ok) throw new Error(`Status ${res.status}`);
  //       const data = await res.json();
  //       if (!data?.results) throw new Error('Invalid response');
  //       console.log('detect results', data.results);
  //       // Process detection results
  //       const selection = getBestOutfitOrParts(data.results);

  //       if (selection) {
  //         setDetected(selection);
  //       } else {
  //         // Handle individual item detection
  //         const bestShirt = getBestByType(data.results, 'shirt');
  //         const bestPant = getBestByType(data.results, 'pant');
  //         const bestShoe = getBestByType(data.results, 'shoe');

  //         const out: Record<string, any> = {};
  //         if (bestShirt) out.shirt = bestShirt;
  //         if (bestPant) out.pant = bestPant;
  //         if (bestShoe) out.shoe = bestShoe;

  //         setDetected(out);
  //       }
  //       clearInterval(interval);
  //       setProgress(100);
  //     } catch (err: any) {
  //       console.error('detect error', err);
  //       clearInterval(interval);
  //       setProgress(100);
  //       setDetectError(`${err?.message} | No avatar selected` || 'Failed to detect items');
  //     } finally {
  //       setLoadingDetected(false);
  //     }
  //   };

  //   run();
  // }, []);

  useEffect(() => {
    const hasAvatar = Boolean(avatarId?.trim());
    if (!hasAvatar) {
      setLoadingDetected(false);
      setDetectError(null);
      setProgress(0);
      setDetected({});
      return;
    }

    const run = async () => {
      setLoadingDetected(true);
      setDetectError(null);
      setProgress(0);

      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;

        let newProgress = (elapsed / 60) * 100;

        if (newProgress >= 100) {
          newProgress = 100;
          clearInterval(interval);
        } else if (elapsed > 60 && newProgress >= 95) {
          newProgress = 95;
          clearInterval(interval);
        }

        setProgress(newProgress);
      }, 100);

      try {
        const thumbnailResponse = await fetch(
          `https://glb.streamoji.com/api/render-thumbnail?avatarId=${avatarId}&bodyType=Full`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!thumbnailResponse.ok) {
          throw new Error("Failed to render thumbnail");
        }

        const blob = await thumbnailResponse.blob();
        const localPreviewUrl = URL.createObjectURL(blob);
        console.log("Frontend Preview URL:", localPreviewUrl);

        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", blob);
        cloudinaryFormData.append("upload_preset", "avatar");

        const cloudinaryRes = await fetch(
          // "https://api.cloudinary.com/v1_1/dxbwtvcfh/image/upload",
          "https://api.cloudinary.com/v1_1/b4h8sbtm/image/upload",
          {
            method: "POST",
            body: cloudinaryFormData,
          },
        );

        if (!cloudinaryRes.ok) {
          throw new Error("Failed to upload image to Cloudinary");
        }

        const cloudinaryData = await cloudinaryRes.json();
        const cloudinaryUrl = cloudinaryData.secure_url;
        console.log("Cloudinary URL:", cloudinaryUrl);

        setAvatarPreview(cloudinaryUrl);

        const identifyFormData = new FormData();
        identifyFormData.append("file", blob, "avatar.png");

        const identifyRes = await fetch("http://localhost:8000/identify", {
          method: "POST",
          body: identifyFormData,
        });

        if (!identifyRes.ok) {
          throw new Error(`Identify API failed: ${identifyRes.status}`);
        }

        const identifyData = await identifyRes.json();

        if (identifyData.status !== "ok" || !identifyData.matches) {
          throw new Error("Invalid identify response");
        }

        const matchedItems: Record<string, any> = {};
        Object.entries(identifyData.matches).forEach(
          ([matchType, matchValue]) => {
            const match = matchValue as {
              asset_id: string | null;
              name: string | null;
              confidence: number;
              description?: string | null;
            };

            const assetId = resolveAssetId(
              match.asset_id,
              (match.description ?? match.asset_id)
                ? `Asset ID: ${match.asset_id}`
                : undefined,
            );
            const libraryImage = resolveAssetImage(
              assetId,
              match.description,
              cloudinaryUrl,
            );
            const libraryLink = resolveAssetLink(assetId, match.description);

            matchedItems[matchType] = {
              type: matchType,
              title: match.name || `No strong match`,
              description: assetId
                ? `Asset ID: ${assetId}`
                : "No asset matched above threshold",
              confidence: match.confidence ?? 0,
              itemUrl: libraryImage || cloudinaryUrl,
              price: assetId && ASSET_LINK_MAP[assetId] ? "$30" : "—",
              purchaseLink: libraryLink,
              assetId,
            };
          },
        );

        if (Object.keys(matchedItems).length === 0) {
          throw new Error("No outfit items were found for this avatar.");
        }

        setDetected(matchedItems);

        clearInterval(interval);
        setProgress(100);
      } catch (err: any) {
        console.error("detect error", err);

        clearInterval(interval);
        setProgress(100);

        const errorMessage =
          err?.message || "Failed to detect items for this avatar.";
        setDetectError(errorMessage);
        setDetected({});
      } finally {
        setLoadingDetected(false);
      }
    };

    run();
  }, [avatarId, token]);
  console.log("Detected items:", detected);

  const hasOutfit = Boolean(detected.outfit);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_25%)]" />
      <div className="relative mx-auto max-w-6xl p-6 pb-12">
        {/* Page header */}
        <header className="mb-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-8 shadow-[0_25px_45px_-20px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <h1 className="text-4xl font-semibold text-white">Avatar Details</h1>
          <p className="text-slate-300 mt-2 max-w-2xl">
            Review the avatar appearance and outfit details. Click any item to
            view purchase options.
          </p>
        </header>

      {/* Conditional rendering based on loading/error state */}
      {loadingDetected ? (
        <div className="text-center py-20">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-slate-800 rounded-full h-4 mb-4">
              <div
                className="bg-cyan-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-slate-300">
              Detecting outfit... {Math.round(progress)}%
            </p>
          </div>
        </div>
      ) : !avatarId ? (
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-slate-800/80 bg-slate-900/90 p-10 text-center shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
          <h2 className="text-3xl font-semibold text-white">
            No avatar selected
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-7">
            Select an avatar to view its outfit details, the matching items, and purchase recommendations.
          </p>
          <div className="mt-8 inline-flex rounded-full bg-slate-800/80 px-4 py-2 text-sm text-slate-200">
            Please choose an avatar so we can detect its outfit and present suggestions.
          </div>
        </div>
      ) : detectError ? (
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-rose-500/20 bg-rose-500/5 p-8 text-center shadow-xl shadow-rose-500/10 backdrop-blur-xl">
          <h2 className="text-3xl font-semibold text-rose-200">
            Detection failed
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-7">
            {detectError}
          </p>
          <p className="mt-3 text-slate-500 text-sm">
            If this keeps happening, try selecting a different avatar or refresh the page.
          </p>
        </div>
      ) : (
        // Main content grid
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Avatar display and info */}
          <section className="lg:col-span-1">
            <Card className="overflow-hidden bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
              {/* Avatar image container */}
              <div className="h-96 bg-slate-950/80 flex items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-800/70">
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="h-full object-cover"
                />
              </div>
              {/* Avatar URL for debugging */}
              <div className="px-4 pb-3 text-xs text-slate-500 break-words">
                {avatarUrl}
              </div>
              <CardHeader>
                <CardTitle>Model: Alex</CardTitle>
                <CardDescription>
                  Height: 6'1" • Build: Slim • Gender: Male
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">
                    Detected size: M (Chest 38")
                  </div>
                  <div className="text-sm text-slate-300">
                    Preferred fit: Slim
                  </div>
                  <div className="text-sm text-slate-300">
                    Last updated: Oct 12, 2025
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost">Edit Avatar</Button>
                <Button>Save Outfit</Button>
              </CardFooter>
            </Card>

            {/* Quick actions card */}
            <Card className="mt-4 p-4 bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <div className="mt-3 flex flex-col gap-2">
                <Button variant="outline" className="text-slate-100 border-slate-700 hover:border-cyan-500 hover:text-cyan-300">Share Outfit</Button>
                <Button variant="ghost" className="text-slate-100 hover:text-cyan-300">Compare Sizes</Button>
              </div>
            </Card>
          </section>

          {/* Right column - Detected outfit items */}
          <section className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasOutfit ? (
                <Card className="overflow-hidden bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
                  <div className="h-64 bg-slate-950/80 flex items-center justify-center overflow-hidden rounded-t-[1.5rem] border-b border-slate-800/70">
                    <img
                      // src={detected.outfit.itemUrl}
                      src={avatarPreview}
                      className="object-contain h-full"
                    />
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-5">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-3 py-1 bg-cyan-500/15 text-cyan-300 text-xs font-semibold rounded-full">
                        {/* {type.toUpperCase()} */}
                        OUTFIT
                      </span>
                      <span className="text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">
                        {/* {(item.confidence * 100).toFixed(0)}% Match */}
                        100% Match
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                      {/* {item.title ||
                            `Premium ${
                              type.charAt(0).toUpperCase() + type.slice(1)
                            }`} */}
                      Item
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                      {/* {item.description ||
                            `High-quality ${type} perfect for your style.`} */}
                      Description of the outfit item.
                    </p>

                    {/* Details Grid */}
                    {/* {(item.size || item.fabric || item.occasion) && (
                          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                            {item.size && (
                              <div>
                                <p className="text-slate-400 font-medium">
                                  Size
                                </p>
                                <p className="text-white font-semibold">
                                  {item.size}
                                </p>
                              </div>
                            )}
                            {item.fabric && (
                              <div>
                                <p className="text-slate-400 font-medium">
                                  Material
                                </p>
                                <p className="text-white font-semibold">
                                  {item.fabric}
                                </p>
                              </div>
                            )}
                            {item.occasion && (
                              <div className="col-span-2">
                                <p className="text-slate-400 font-medium">
                                  Occasion
                                </p>
                                <p className="text-white font-semibold">
                                  {item.occasion}
                                </p>
                              </div>
                            )}
                          </div>
                        )} */}

                    {/* Price Section */}
                    <div className="border-t border-slate-800/70 pt-4 mb-4">
                      <p className="text-3xl font-bold text-white">
                        {/* {item.price || "$99"} */}
                        {/* $199 */}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Free shipping on orders over $50
                      </p>
                    </div>

                    {/* Buy Now Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200"
                      onClick={() => window.open("#", "_blank")}
                    >
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                ["head", "torso", "legs", "feet"].map((type) => {
                  const item = detected[type];
                  const assetId = getAssetIdFromDescription(item?.description);
                  if (!item?.title || item?.title === "No strong match")
                    return null;

                  const foundAsset = ASSET_IMAGE_LIBRARY.find(
                    (asset) => asset.asset_id.toLowerCase() === assetId,
                  );

                  const mainCard = (
                    <Card
                      key={type}
                      className="overflow-hidden bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 transition-shadow duration-300"
                    >
                      {/* Product Image */}
                      <div className="h-64 bg-slate-950/80 flex items-center justify-center overflow-hidden border-b border-slate-800/70">
                        <img
                          src={foundAsset?.image || avatarPreview}
                          alt={type}
                          className="object-contain h-full w-full p-4"
                        />
                      </div>

                      {/* Card Content */}
                      <CardContent className="p-5">
                        {/* Category Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-block px-3 py-1 bg-cyan-500/15 text-cyan-300 text-xs font-semibold rounded-full">
                            {type.toUpperCase()}
                          </span>
                          <span className="text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">
                            {(item.confidence * 100).toFixed(0)}% Match
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                          {item.title ||
                            `Detected ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                          {item.description || `Detected asset for ${type}.`}
                        </p>

                        {/* Details Grid */}
                        {(item.size || item.fabric || item.occasion) && (
                          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                            {item.size && (
                              <div>
                                <p className="text-slate-400 font-medium">
                                  Size
                                </p>
                                <p className="text-white font-semibold">
                                  {item.size}
                                </p>
                              </div>
                            )}
                            {item.fabric && (
                              <div>
                                <p className="text-slate-400 font-medium">
                                  Material
                                </p>
                                <p className="text-white font-semibold">
                                  {item.fabric}
                                </p>
                              </div>
                            )}
                            {item.occasion && (
                              <div className="col-span-2">
                                <p className="text-slate-400 font-medium">
                                  Occasion
                                </p>
                                <p className="text-white font-semibold">
                                  {item.occasion}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price Section */}
                        <div className="border-t border-slate-800/70 pt-4 mb-4">
                          <p className="text-3xl font-bold text-white">
                            {/* {item.price || "$99"} */}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Free shipping on orders over $50
                          </p>
                        </div>

                        {/* Buy Now Button */}
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200"
                          onClick={() => window.open(foundAsset?.link || "#", "_blank")}
                        >
                          Buy Now
                        </Button>
                      </CardContent>
                    </Card>
                  );

                  const extraCards: React.ReactNode[] = [];
                  if (
                    foundAsset?.asset_images?.length &&
                    foundAsset?.assets_links?.length
                  ) {
                    const extraCount = Math.min(
                      foundAsset.asset_images.length,
                      foundAsset.assets_links.length,
                      2,
                    );

                    for (let extraIndex = 0; extraIndex < extraCount; extraIndex += 1) {
                      extraCards.push(
                        <Card
                          key={`${type}-extra-${extraIndex}`}
                          className="overflow-hidden bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 transition-shadow duration-300"
                        >
                          <div className="h-64 bg-slate-950/80 flex items-center justify-center overflow-hidden border-b border-slate-800/70">
                            <img
                              src={foundAsset.asset_images[extraIndex]}
                              alt={`${type}-extra-${extraIndex}`}
                              className="object-contain h-full w-full p-4"
                            />
                          </div>
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="inline-block px-3 py-1 bg-slate-800/80 text-slate-200 text-xs font-semibold rounded-full">
                                RELATED
                              </span>
                              <span className="text-xs font-medium text-slate-300 bg-slate-800/70 px-2 py-1 rounded">
                                Alt #{extraIndex + 1}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                              Related library match
                            </h3>
                            <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                              Additional asset image and purchase link from the same library item.
                            </p>
                            <div className="border-t border-slate-800/70 pt-4 mb-4">
                              <p className="text-3xl font-bold text-white">
                                {/* $99 */}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Free shipping on orders over $50
                              </p>
                            </div>
                            <Button
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200"
                              onClick={() =>
                                window.open(
                                  foundAsset.assets_links[extraIndex] || "#",
                                  "_blank",
                                )
                              }
                            >
                              Buy Now
                            </Button>
                          </CardContent>
                        </Card>,
                      );
                    }
                  }

                  return [mainCard, ...extraCards];
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
    </div>

  );
};

export default AvatarDetails;
