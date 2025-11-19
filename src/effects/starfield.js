/**
 * Dynamic Glowing Star Field Overlay
 * Creates a subtle, high-performance animated star field effect
 * on a fixed canvas overlay.
 *
 * Features:
 * - Randomly positioned particles with subtle glow
 * - Slow drifting motion
 * - Low opacity for non-intrusive background effect
 * - Responsive to window resizing
 * - Optimized for performance with requestAnimationFrame
 */

class StarFieldEffect {
  constructor() {
    this.canvas = document.getElementById('luma-effect-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;

    // Configuration
    this.config = {
      particleCount: 60, // Number of particles (subtle amount)
      minOpacity: 0.08,
      maxOpacity: 0.35,
      minSize: 0.5,
      maxSize: 2.5,
      driftSpeed: 0.3, // Slow drift speed
      glowColor: '#A0C4FF', // Soft blue glow (complements any background)
      ambientGlowColor: 'rgba(160, 196, 255, 0.05)', // Very subtle ambient glow
    };

    // Initialize
    this.resizeCanvas();
    this.initializeParticles();
    this.startAnimation();

    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Resize canvas to match window dimensions
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Initialize particles with random positions
   */
  initializeParticles() {
    this.particles = [];

    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * (this.config.maxSize - this.config.minSize) + this.config.minSize,
        opacity: Math.random() * (this.config.maxOpacity - this.config.minOpacity) + this.config.minOpacity,
        driftX: (Math.random() - 0.5) * this.config.driftSpeed,
        driftY: (Math.random() - 0.5) * this.config.driftSpeed,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Draw a single particle with glow effect
   */
  drawParticle(particle) {
    const { ctx } = this;

    // Apply twinkling effect
    const twinkling = Math.sin(Date.now() * particle.twinkleSpeed + particle.twinkleOffset) * 0.3;
    const currentOpacity = particle.opacity + twinkling * particle.opacity;

    // Draw outer glow
    const gradient = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.size * 3
    );
    gradient.addColorStop(0, `rgba(160, 196, 255, ${currentOpacity * 0.6})`);
    gradient.addColorStop(0.5, `rgba(160, 196, 255, ${currentOpacity * 0.2})`);
    gradient.addColorStop(1, 'rgba(160, 196, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(
      particle.x - particle.size * 3,
      particle.y - particle.size * 3,
      particle.size * 6,
      particle.size * 6
    );

    // Draw core
    ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Update particle positions
   */
  updateParticles() {
    this.particles.forEach((particle) => {
      // Update position with drift
      particle.x += particle.driftX;
      particle.y += particle.driftY;

      // Wrap around edges
      if (particle.x < -particle.size * 3) {
        particle.x = this.canvas.width + particle.size * 3;
      } else if (particle.x > this.canvas.width + particle.size * 3) {
        particle.x = -particle.size * 3;
      }

      if (particle.y < -particle.size * 3) {
        particle.y = this.canvas.height + particle.size * 3;
      } else if (particle.y > this.canvas.height + particle.size * 3) {
        particle.y = -particle.size * 3;
      }
    });
  }

  /**
   * Render frame
   */
  render() {
    // Clear canvas with transparency
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Optional: Add very subtle ambient glow (can be removed for more subtlety)
    // this.ctx.fillStyle = this.config.ambientGlowColor;
    // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all particles
    this.particles.forEach((particle) => this.drawParticle(particle));
  }

  /**
   * Animation loop
   */
  animate() {
    this.updateParticles();
    this.render();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Start the animation
   */
  startAnimation() {
    this.animate();
  }

  /**
   * Stop the animation (for cleanup)
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Toggle visibility of the effect
   */
  toggleVisibility(visible) {
    if (this.canvas) {
      this.canvas.style.opacity = visible ? '1' : '0';
      this.canvas.style.transition = 'opacity 0.3s ease-in-out';
    }
  }
}

// Initialize star field effect when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.starFieldEffect = new StarFieldEffect();
  });
} else {
  window.starFieldEffect = new StarFieldEffect();
}
