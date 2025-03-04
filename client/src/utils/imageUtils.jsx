// Function to get all image URLs dynamically from the assets folder
function getCarouselImages() {
  try {
    const imageContext = import.meta.glob(
      '../assets/slideshow_img/*.{jpg,jpeg,png,svg}',
      {
        eager: true,
        import: 'default'
      }
    );

    const images = Object.entries(imageContext).map(([path, module]) => {
      // Extract filename without extension to use as title
      const fileName = path.split('/').pop();
      const title = fileName.split('.')[0];
      
      return {
        url: module, // Module itself contains the processed image URL
        title: title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, ' '),
        fileName: fileName
      };
    });

    return images;
  } catch (error) {
    console.error('Error loading carousel images:', error);
    return [];
  }
}

// Execute and export the result
const carouselImages = getCarouselImages();
export default carouselImages;