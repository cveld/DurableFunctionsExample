using System;
using System.Collections.Generic;
using System.Text;

namespace FunctionApp
{
    public class Color
    {
        public byte r;
        public byte g;
        public byte b;
        public byte a;

        public static Color FromDouble(double r, double g, double b)
        {
            return new Color
            {
                r = ToByte(r),
                g = ToByte(g),
                b = ToByte(b),
                a = 255
            };
        }

        static private byte ToByte(double d)
        {
            return d > 255 ? (byte)255 : (byte)Math.Floor(d);
        }
    }

    public class FractalInit
    {
        public int height;
        public int maxIterations;
        public int width;
        public double xMax;
        public double xMin;
        public double yMax;
        public double yMin;
    }

    public class FractalMandelbrot
    {
        int height;
        int maxIterations;
        int width;
        double xMax;
        double xScale;
        double xMin;
        double yMax;
        double yScale;
        double yMin;
        byte[] pixels;
        Random rnd = new Random();

        public FractalMandelbrot(FractalInit init)
        {
            this.xMin = init.xMin;
            this.xMax = init.xMax;
            this.yMin = init.yMin;
            this.yMax = init.yMax;
            this.width = init.width;
            this.height = init.height;
            this.maxIterations = init.maxIterations;
            this.pixels = new byte[width * height * 4];
        }
        void updatePixel(int index, byte r, byte g, byte b, byte a = 255)
        {
            this.pixels[index] = r;
            this.pixels[index + 1] = g;
            this.pixels[index + 2] = b;
            this.pixels[index + 3] = a;
        }
        int coord2Index(int x, int y)
        {
            return 4 * (y * this.width + x);
        }

        (int, int) iterate2(double t, double e, double n, double i, int maxiterations)
        {
            double r1 = 0;
            double i1 = 0;
            var y1 = i;
            var x1 = n;
            double r1pow2;
            double i1pow2;
            double rlastpow = 0;

            var iterations = maxiterations;
            var iter = 0;
            double rpow = 0;
            while ((iter < iterations) && (rpow < 4))
            {
                r1pow2 = r1 * r1;
                i1pow2 = i1 * i1;
                i1 = 2 * i1 * r1 + y1;
                r1 = r1pow2 - i1pow2 + x1;
                rlastpow = rpow;
                rpow = r1pow2 + i1pow2;
                iter++;
            }

            //if (RenderInterpolated == 1)
            //{
            double count_f = iter + (4 - rlastpow) / (rpow - rlastpow) - 1;
            int factor = (int)((1.0 - (iter - count_f)) * 255);
            if (factor > 255)
            {                
                factor = 255;
            }
            return (iter, factor);
                //dst[idx++] = Utils.InterpolateColors(Palette[iter - 1], Palette[iter], factor);
            //}
            //else
            //{
            //    iter = iter % Palette.Length;
            //    dst[idx++] = Palette[iter];
            //}
        }

        int iterate(double t, double e, double n, double i, int maxiterations)
        {
            for (var iteration = 0; ;)
            {
                if (++iteration > maxiterations) return 0;
                var s = 2 * e * t + i;
                if (t > 4 || e > 4) return iteration;
                t = t * t - e * e + n;
                e = s;
            }
        }

        private Color InterpolateColors(int s1, int s2, int maxiterations, int weight)
        {
            if (s1 == -1)
            {
                Console.WriteLine("overflow");
            }
            Color c1 = getColorHsl(s1, maxiterations);
            Color c2 = getColorHsl(s2, maxiterations);

            if (c2.r == 0 && c2.g == 0 && c2.b == 0)
            {

            }

            if (weight >= 255 )
            {
                //Console.WriteLine("overflow");
            }

            if (weight < 0)
            {
                weight = 0;
            }

            int redi = (int)c1.r + ((int)((c2.r - c1.r) * weight) >> 8);
            int greeni = (int)c1.g + ((int)((c2.g - c1.g) * weight) >> 8);
            int bluei = (int)c1.b + ((int)((c2.b - c1.b) * weight) >> 8);

            byte red = ToByte(redi);
            byte green = ToByte(greeni); 
            byte blue = ToByte(bluei);

            if (red == 0 && green == 0 && blue == 0)
            {

            }

            return new Color
            {
                r = red,
                g = green,
                b = blue,
                a = 255
            };
        }

        byte ToByte(int i)
        {
            if (i > 255)
            {
                return 255;
            }
            if (i < 0)
            {
                return 0;
            }

            return (byte)i;
        }

        public byte[] compute()
        {
            this.xScale = (this.xMax - this.xMin) / this.width;
            this.yScale = (this.yMax - this.yMin) / this.height;

            for (var t = 0; t < this.width; t++)
                for (var e = 0; e < this.height; e++)
                {
                    //var n = this.iterate(0, 0, t * this.xScale + this.xMin, e * this.yScale + this.yMin, this.maxIterations);
                    (var n, var factor) = this.iterate2(0, 0, t * this.xScale + this.xMin, e * this.yScale + this.yMin, this.maxIterations);

                    // Color c = this.getColor(n, this.maxIterations);

                    Color c = n == maxIterations ? Color.FromDouble(0, 0, 0) : this.InterpolateColors(n-1, n, maxIterations, factor);
                        
                    this.updatePixel(this.coord2Index(t, e), c.r, c.g, c.b);
                    
                }
            //return new ImageData(Uint8ClampedArray.from(this.pixels),this.width,this.height);
            //return Uint8ClampedArray.from(this.pixels);
            return this.pixels;
        }

        Color getColorHsl(int iteration, double maxiterations) {
            double h = iteration / maxiterations;
            const double s = 1;
            const double l = .5;

        double r, g, b;

        Func<double, double, double, double> hue2rgb = (a, c, t) => {
          if (t< 0) { t += 1.0; }
          if (t > 1.0) { t -= 1.0; }
          if (t< 1.0 / 6.0) { return a + (c - a) * 6.0 * t; }
          if (t< 1.0 / 2.0) { return c; }
          if (t< 2.0 / 3.0) { return a + (c - a) * (2.0 / 3.0 - t) * 6.0; }
          return a;
        };

        var q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);        

        return Color.FromDouble(r * 255.0, g * 255.0, b * 255.0);
  }

        Color getColor(int iteration, double maxiterations)
        {
            if (iteration >= maxIterations)
            {
                iteration = maxIterations;
                //return new Color
                //{
                //    r = 255,
                //    g = 255,
                //    b = 0,
                //    a = 255
                //};
            }
            // t,e
            //int top = (int)Math.Floor(maxiterations);
            //iteration = rnd.Next() % top;
            double n = iteration / maxiterations;
            
            //return Color.FromDouble(n / .125 * 512 + .5, 0, 0);
            if (n >= 0 && n < .125)
            {
                return Color.FromDouble(n / .125 * 512 + .5, 0, 0);
            };

            if (n >= .125 && n < .25)
            {
                return Color.FromDouble(255, (n - .125) / .125 * 512 + .5, 0);
            }

            if (n >= .25 && n < .375)
            {
                return Color.FromDouble(512 * (1 - (n - .25) / .125) + .5, 255, 0);
            }
            if (n >= .375 && n < .5)
            {
                return Color.FromDouble(0, 255, (n - .375) / .125 * 512 + .5);
            }
            if (n >= .5 && n < .625)
            {
                return Color.FromDouble(0, 512 * (1 - (n - .5) / .125) + .5, 255);
            }
            if (n >= .625 && n < .75)
            {
                return Color.FromDouble((n - .625) / .125 * 512 + .5, 0, 255);
            }
            if (n >= .75 && n < .875)
            {
                return Color.FromDouble(255, (n - .75) / .125 * 512 + .5, 255);
            }
            if (n >= .875 && n <= 1)
            {
                return Color.FromDouble(512 * (1 - (n - .875) / .125) + .5, 512 * (1 - (n - .875) / .125) + .5, 512 * (1 - (n - .875) / .125) + .5);
            }

            throw new ArgumentOutOfRangeException(nameof(iteration));

            //    FractalMandelbrot.prototype.toInteger = function(t)
            //    {
            //        return Math[t < 0 ? "ceil" : "floor"](t)
            //}


        }
    }
}

