import Image, {type ImageProps} from 'next/image';

/** Optimise academy uploads; external images remain compatible without a remote fetch allowlist. */
export default function Photo({src, alt, ...props}: Omit<ImageProps, 'width' | 'height'>) {
  return <Image src={src} alt={alt} width={1600} height={1000}
    loading={props.fetchPriority === 'high' ? 'eager' : 'lazy'}
    sizes="(max-width: 640px) 100vw, (max-width: 1000px) 65vw, 50vw"
    unoptimized={typeof src === 'string' && !src.startsWith('/')}
    {...props}/>;
}
