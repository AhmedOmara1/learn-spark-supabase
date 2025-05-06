import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Users } from "lucide-react";

export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  studentsCount: number;
  lessonsCount: number;
  price: number;
  imageSrc: string;
}

const CourseCard = ({
  id,
  title,
  description,
  instructor,
  category,
  level,
  studentsCount,
  lessonsCount,
  price,
  imageSrc,
}: CourseCardProps) => {
  return (
    <Card className="overflow-hidden hover-card border-border bg-card h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10" />
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-block bg-brand-purple/90 text-white text-xs px-2 py-1 rounded-md">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-20">
          <span className="inline-block bg-background/90 text-xs px-2 py-1 rounded-md">
            {level}
          </span>
        </div>
      </div>
      <CardContent className="pt-6 flex-grow">
        <h3 className="text-lg font-semibold line-clamp-2 mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
        <p className="text-sm text-brand-purple">{instructor}</p>
        
        {/* Display course price */}
        <p className="text-sm font-semibold text-brand-purple mt-2">
          {price > 0 ? `$${price.toFixed(2)}` : 'Free'}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Book className="h-4 w-4 mr-1" />
            <span>{lessonsCount} lessons</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{studentsCount} students</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-4">
        <Link to={`/courses/${id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Course
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
