<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let canvas: HTMLCanvasElement;
  let animationId: number;
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let isMouseMoving = false;
  let mouseVelocityX = 0;
  let mouseVelocityY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseTimeout: number;

  interface Particle {
    x: number;
    y: number;
    z: number;
    baseX: number;
    baseY: number;
    vx: number;
    vy: number;
    vz: number;
    size: number;
    baseSize: number;
    color: string;
    angle: number;
    speed: number;
    orbit: number;
    pulsePhase: number;
    type: 'normal' | 'trail' | 'explosion';
    life: number;
    maxLife: number;
  }

  interface Ripple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    opacity: number;
    color: string;
  }

  class ParticleSystem {
    particles: Particle[] = [];
    trailParticles: Particle[] = [];
    ripples: Ripple[] = [];
    ctx: CanvasRenderingContext2D | null = null;
    width = 0;
    height = 0;
    time = 0;
    mouseTrail: {x: number, y: number}[] = [];
    dataStreams: {x: number, y: number, speed: number, chars: string[], offset: number}[] = [];
    
    constructor(canvas: HTMLCanvasElement) {
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.resize();
      this.initParticles();
      this.initDataStreams();
    }

    resize() {
      if (!canvas) return;
      this.width = canvas.width = window.innerWidth;
      this.height = canvas.height = window.innerHeight;
      this.initDataStreams();
    }

    initDataStreams() {
      this.dataStreams = [];
      const streamCount = Math.floor(this.width / 80);
      
      for (let i = 0; i < streamCount; i++) {
        const chars = [];
        const charCount = Math.floor(Math.random() * 10 + 5);
        for (let j = 0; j < charCount; j++) {
          chars.push(Math.random() > 0.5 ? '01'[Math.floor(Math.random() * 2)] : 
                     String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)));
        }
        
        this.dataStreams.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          speed: Math.random() * 2 + 0.5,
          chars,
          offset: Math.random() * 100
        });
      }
    }

    initParticles() {
      const particleCount = Math.min(200, Math.floor((this.width * this.height) / 10000));
      this.particles = [];
      
      // Create grid of particles with orbital motion
      const cols = Math.ceil(Math.sqrt(particleCount * (this.width / this.height)));
      const rows = Math.ceil(particleCount / cols);
      const cellWidth = this.width / cols;
      const cellHeight = this.height / rows;
      
      for (let i = 0; i < particleCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const baseX = (col + 0.5) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.5;
        const baseY = (row + 0.5) * cellHeight + (Math.random() - 0.5) * cellHeight * 0.5;
        
        this.particles.push({
          x: baseX,
          y: baseY,
          z: Math.random() * 1000,
          baseX,
          baseY,
          vx: 0,
          vy: 0,
          vz: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          baseSize: Math.random() * 3 + 1,
          color: Math.random() > 0.5 ? '#E94560' : '#00FFFF',
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.01,
          orbit: Math.random() * 50 + 20,
          pulsePhase: Math.random() * Math.PI * 2,
          type: 'normal',
          life: 1,
          maxLife: 1
        });
      }
    }

    createExplosion(x: number, y: number, force: number) {
      const explosionParticles = 30;
      for (let i = 0; i < explosionParticles; i++) {
        const angle = (Math.PI * 2 * i) / explosionParticles;
        const speed = Math.random() * force * 10 + force * 5;
        
        this.trailParticles.push({
          x,
          y,
          z: 500,
          baseX: x,
          baseY: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: 0,
          size: Math.random() * 4 + 2,
          baseSize: Math.random() * 4 + 2,
          color: Math.random() > 0.3 ? '#E94560' : '#00FFFF',
          angle: 0,
          speed: 0,
          orbit: 0,
          pulsePhase: 0,
          type: 'explosion',
          life: 1,
          maxLife: 1
        });
      }
    }

    createRipple(x: number, y: number) {
      this.ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: 200,
        opacity: 0.5,
        color: Math.random() > 0.5 ? '#E94560' : '#00FFFF'
      });
    }

    update(mouseX: number, mouseY: number, mouseVelocityX: number, mouseVelocityY: number, isMouseMoving: boolean) {
      this.time += 0.016;
      
      // Update ripples
      this.ripples = this.ripples.filter(ripple => {
        ripple.radius += 5;
        ripple.opacity = (1 - ripple.radius / ripple.maxRadius) * 0.5;
        return ripple.radius < ripple.maxRadius;
      });
      
      // Update data streams
      this.dataStreams.forEach(stream => {
        stream.y += stream.speed;
        if (stream.y > this.height + 100) {
          stream.y = -100;
          stream.x = Math.random() * this.width;
        }
      });
      
      // Add mouse trail
      if (isMouseMoving) {
        this.mouseTrail.push({x: mouseX, y: mouseY});
        if (this.mouseTrail.length > 20) {
          this.mouseTrail.shift();
        }
        
        // Create trail particles
        if (Math.random() > 0.3) {
          this.trailParticles.push({
            x: mouseX + (Math.random() - 0.5) * 20,
            y: mouseY + (Math.random() - 0.5) * 20,
            z: 500,
            baseX: mouseX,
            baseY: mouseY,
            vx: mouseVelocityX * 0.2 + (Math.random() - 0.5) * 2,
            vy: mouseVelocityY * 0.2 + (Math.random() - 0.5) * 2,
            vz: 0,
            size: Math.random() * 3 + 1,
            baseSize: Math.random() * 3 + 1,
            color: Math.random() > 0.5 ? '#E94560' : '#00FFFF',
            angle: 0,
            speed: 0,
            orbit: 0,
            pulsePhase: 0,
            type: 'trail',
            life: 1,
            maxLife: 1
          });
        }
      } else {
        if (this.mouseTrail.length > 0) {
          this.mouseTrail.pop();
        }
      }
      
      // Update main particles with enhanced interaction
      this.particles.forEach((particle) => {
        // Orbital motion around base position
        particle.angle += particle.speed;
        const orbitX = Math.cos(particle.angle) * particle.orbit;
        const orbitY = Math.sin(particle.angle) * particle.orbit * 0.5;
        
        // 3D wave motion
        const waveX = Math.sin(this.time * 2 + particle.z * 0.01) * 10;
        const waveY = Math.cos(this.time * 1.5 + particle.z * 0.01) * 10;
        
        // Mouse attraction/repulsion with stronger effect
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
          const force = (200 - distance) / 200;
          const attraction = Math.sin(this.time * 3 + particle.pulsePhase) > 0 ? 1 : -1;
          
          particle.vx += (dx / distance) * force * 3 * attraction;
          particle.vy += (dy / distance) * force * 3 * attraction;
          
          // Size pulse when near mouse
          particle.size = particle.baseSize * (1 + force * 0.5);
          
          // Speed up orbit near mouse
          particle.angle += force * 0.05;
        } else {
          particle.size = particle.baseSize;
        }
        
        // Apply forces
        particle.x = particle.baseX + orbitX + waveX + particle.vx;
        particle.y = particle.baseY + orbitY + waveY + particle.vy;
        particle.z += particle.vz;
        
        // Damping
        particle.vx *= 0.92;
        particle.vy *= 0.92;
        particle.vz *= 0.98;
        
        // Boundary wrapping for z
        if (particle.z < 0) particle.z = 1000;
        if (particle.z > 1000) particle.z = 0;
        
        // Keep particles on screen with elastic boundary
        if (particle.x < 0 || particle.x > this.width) {
          particle.vx *= -0.8;
          particle.x = Math.max(0, Math.min(this.width, particle.x));
        }
        if (particle.y < 0 || particle.y > this.height) {
          particle.vy *= -0.8;
          particle.y = Math.max(0, Math.min(this.height, particle.y));
        }
      });
      
      // Update trail particles
      this.trailParticles = this.trailParticles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.life -= 0.02;
        particle.size = particle.baseSize * particle.life;
        
        return particle.life > 0;
      });
    }

    draw() {
      if (!this.ctx) return;
      
      // Clear with fade effect
      this.ctx.fillStyle = 'rgba(15, 20, 30, 0.08)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Draw data streams in background
      this.ctx.save();
      this.ctx.globalAlpha = 0.15;
      this.ctx.font = '12px monospace';
      this.ctx.fillStyle = '#00FFFF';
      
      this.dataStreams.forEach(stream => {
        stream.chars.forEach((char, i) => {
          const y = stream.y - i * 15 + stream.offset;
          const opacity = 1 - (i / stream.chars.length);
          this.ctx!.globalAlpha = opacity * 0.15;
          this.ctx!.fillText(char, stream.x, y);
        });
      });
      this.ctx.restore();
      
      // Draw ripples
      this.ripples.forEach(ripple => {
        this.ctx!.strokeStyle = ripple.color + Math.floor(ripple.opacity * 255).toString(16).padStart(2, '0');
        this.ctx!.lineWidth = 2;
        this.ctx!.beginPath();
        this.ctx!.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx!.stroke();
      });
      
      // Draw mouse trail
      if (this.mouseTrail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouseTrail[0].x, this.mouseTrail[0].y);
        
        for (let i = 1; i < this.mouseTrail.length; i++) {
          const point = this.mouseTrail[i];
          const prevPoint = this.mouseTrail[i - 1];
          const cp1x = (prevPoint.x + point.x) / 2;
          const cp1y = (prevPoint.y + point.y) / 2;
          
          this.ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cp1x, cp1y);
        }
        
        const gradient = this.ctx.createLinearGradient(
          this.mouseTrail[0].x, this.mouseTrail[0].y,
          this.mouseTrail[this.mouseTrail.length - 1].x, this.mouseTrail[this.mouseTrail.length - 1].y
        );
        gradient.addColorStop(0, '#E9456000');
        gradient.addColorStop(0.5, '#E94560AA');
        gradient.addColorStop(1, '#00FFFFAA');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      }
      
      // Draw particle connections with dynamic opacity
      this.particles.forEach((particle, i) => {
        for (let j = i + 1; j < this.particles.length; j++) {
          const other = this.particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const dz = (particle.z - other.z) * 0.1;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.4;
            const opacityHex = Math.max(0, Math.min(255, Math.floor(opacity * 255))).toString(16).padStart(2, '0');
            
            const gradient = this.ctx!.createLinearGradient(
              particle.x, particle.y, other.x, other.y
            );
            gradient.addColorStop(0, particle.color + opacityHex);
            gradient.addColorStop(0.5, '#FFFFFF' + opacityHex);
            gradient.addColorStop(1, other.color + opacityHex);
            
            this.ctx!.strokeStyle = gradient;
            this.ctx!.lineWidth = Math.max(0.5, 2 - dist / 50);
            this.ctx!.beginPath();
            this.ctx!.moveTo(particle.x, particle.y);
            this.ctx!.lineTo(other.x, other.y);
            this.ctx!.stroke();
          }
        }
      });
      
      // Draw particles with enhanced effects
      [...this.particles, ...this.trailParticles].forEach(particle => {
        const scale = (1000 - particle.z) / 1000;
        const size = particle.size * scale;
        const opacity = particle.type === 'trail' || particle.type === 'explosion' 
          ? particle.life * 0.8 
          : scale * 0.9;
        
        // Multi-layer glow effect
        for (let layer = 3; layer > 0; layer--) {
          const layerSize = size * (layer * 2);
          const layerOpacity = opacity * (0.2 / layer);
          const glowGradient = this.ctx!.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, layerSize
          );
          
          const opacityHex = Math.max(0, Math.min(255, Math.floor(layerOpacity * 255))).toString(16).padStart(2, '0');
          glowGradient.addColorStop(0, particle.color + opacityHex);
          glowGradient.addColorStop(0.5, particle.color + Math.floor(layerOpacity * 128).toString(16).padStart(2, '0'));
          glowGradient.addColorStop(1, particle.color + '00');
          
          this.ctx!.fillStyle = glowGradient;
          this.ctx!.beginPath();
          this.ctx!.arc(particle.x, particle.y, layerSize, 0, Math.PI * 2);
          this.ctx!.fill();
        }
        
        // Core particle with bright center
        const coreGradient = this.ctx!.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, size
        );
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.3, particle.color);
        coreGradient.addColorStop(1, particle.color + Math.floor(opacity * 200).toString(16).padStart(2, '0'));
        
        this.ctx!.fillStyle = coreGradient;
        this.ctx!.beginPath();
        this.ctx!.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        this.ctx!.fill();
      });
    }
  }

  let particleSystem: ParticleSystem | null = null;

  function animate() {
    if (particleSystem) {
      // Smooth mouse movement
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;
      
      particleSystem.update(mouseX, mouseY, mouseVelocityX, mouseVelocityY, isMouseMoving);
      particleSystem.draw();
    }
    animationId = requestAnimationFrame(animate);
  }

  function handleMouseMove(e: MouseEvent) {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
    
    // Calculate velocity
    mouseVelocityX = targetMouseX - lastMouseX;
    mouseVelocityY = targetMouseY - lastMouseY;
    lastMouseX = targetMouseX;
    lastMouseY = targetMouseY;
    
    isMouseMoving = true;
    
    // Clear existing timeout
    if (mouseTimeout) clearTimeout(mouseTimeout);
    
    // Set mouse as not moving after 100ms
    mouseTimeout = setTimeout(() => {
      isMouseMoving = false;
      mouseVelocityX = 0;
      mouseVelocityY = 0;
    }, 100) as any;
    
    // Create ripple effect occasionally
    if (Math.random() > 0.9 && particleSystem) {
      particleSystem.createRipple(targetMouseX, targetMouseY);
    }
  }

  function handleClick(e: MouseEvent) {
    if (particleSystem) {
      const force = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY) * 0.1 + 1;
      particleSystem.createExplosion(e.clientX, e.clientY, force);
      particleSystem.createRipple(e.clientX, e.clientY);
    }
  }

  function handleResize() {
    if (particleSystem) {
      particleSystem.resize();
    }
  }

  onMount(() => {
    if (canvas) {
      particleSystem = new ParticleSystem(canvas);
      mouseX = window.innerWidth / 2;
      mouseY = window.innerHeight / 2;
      targetMouseX = mouseX;
      targetMouseY = mouseY;
      animate();
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);
      window.addEventListener('resize', handleResize);
    }
  });

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (mouseTimeout) {
      clearTimeout(mouseTimeout);
    }
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('click', handleClick);
    window.removeEventListener('resize', handleResize);
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0 w-full h-full"
  style="z-index: 1; pointer-events: auto;"
/>

<style>
  canvas {
    opacity: 0.85;
    mix-blend-mode: screen;
  }
</style>