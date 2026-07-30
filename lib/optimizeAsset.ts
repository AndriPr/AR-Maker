import { WebIO } from '@gltf-transform/core';
import { meshopt, quantize, reorder, dedup, prune, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

export async function optimizeGLB(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    await MeshoptEncoder.ready;
    await MeshoptSimplifier.ready;
    
    const io = new WebIO();
    // readBinary can take Uint8Array
    const doc = await io.readBinary(buffer);
    
    // Apply optimizations (Polishing phase)
    await doc.transform(
      dedup(), // Deduplicate vertices and materials
      prune(), // Remove unused nodes/materials (junk data)
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.75, error: 0.01 }), // Decimate polygons by up to 25%
      reorder({ encoder: MeshoptEncoder }), // Optimize vertex cache
      quantize(), // Compress geometry to 16-bit
      meshopt({ encoder: MeshoptEncoder, level: 'high' }) // High level compression
    );
    
    const optimizedBuffer = await io.writeBinary(doc);
    
    return new File([optimizedBuffer], file.name, { type: 'model/gltf-binary' });
  } catch (err) {
    console.error('Failed to optimize GLB', err);
    // Return original file if optimization fails
    return file;
  }
}
