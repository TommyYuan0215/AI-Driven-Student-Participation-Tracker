const carouselImages = [];

// Function to get all image URLs from the public folder
function getCarouselImages() {
  const imageContext = import.meta.glob('../assets/slideshow_img/*.{jpg,jpeg,png,svg}', {
    eager: true,
    query: '?url', 
    import: 'default'
  });

  Object.entries(imageContext).forEach(([path, imageUrl]) => {
    // Extract filename without extension to use as title
    const title = path.split('/').pop().split('.')[0];
    carouselImages.push({
      url: imageUrl, // Use the URL directly from the import
      title: title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, ' '),
    });
  });

  return carouselImages;
}

export default getCarouselImages;